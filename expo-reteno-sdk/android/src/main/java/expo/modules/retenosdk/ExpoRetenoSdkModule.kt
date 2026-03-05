package expo.modules.retenosdk

import RetenoAnonymousUserAttributes
import RetenoMultiAccountUserAttributesPayload
import RetenoUserAttributesPayload
import android.Manifest
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.google.firebase.FirebaseApp
import com.reteno.core.Reteno
import com.reteno.core.data.remote.model.recommendation.get.Recoms
import com.reteno.core.domain.callback.appinbox.RetenoResultCallback
import com.reteno.core.domain.model.appinbox.AppInboxMessages
import com.reteno.core.domain.model.recommendation.get.RecomRequest
import com.reteno.core.domain.model.recommendation.post.RecomEvent
import com.reteno.core.domain.model.recommendation.post.RecomEventType
import com.reteno.core.domain.model.recommendation.post.RecomEvents
import com.reteno.core.domain.model.user.Address
import com.reteno.core.domain.model.user.User
import com.reteno.core.domain.model.user.UserAttributes
import com.reteno.core.domain.model.user.UserAttributesAnonymous
import com.reteno.core.domain.model.user.UserCustomField
import com.reteno.core.features.appinbox.AppInboxStatus
import com.reteno.core.features.recommendation.GetRecommendationResponseCallback
import com.reteno.core.view.iam.callback.InAppCloseData
import com.reteno.core.view.iam.callback.InAppData
import com.reteno.core.view.iam.callback.InAppErrorData
import com.reteno.core.view.iam.callback.InAppLifecycleCallback
import com.reteno.push.RetenoNotifications
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import java.time.ZonedDateTime


class InitResult : Record {
    @Field val success: Boolean = false
    @Field val message: String = ""
    @Field val androidVersion: Int = Build.VERSION.SDK_INT
}

private fun getStringOrNull(input: String?): String? {
    return if (input.isNullOrBlank()) null else input
}

class ExpoRetenoSdkModule : Module() {
  val permission = Manifest.permission.POST_NOTIFICATIONS
  val PERMISSION_REQUEST_CODE = 1001

  private var inAppLifecycleCallback: InAppLifecycleCallback? = null
  private var messagesCountChangedCallback: RetenoResultCallback<Int>? = null

  init {
    currentInstance = WeakReference(this)
  }

  // This `companion object` is for static access from BroadcastReceiver
  companion object {
    private var currentInstance: WeakReference<ExpoRetenoSdkModule>? = null
    private const val PREFS_NAME = "RetenoPreferences"
    private const val AUTO_OPEN_LINKS_KEY = "auto_open_links"

    // Helper function (if you don't already have it defined elsewhere)
    private fun isAutoOpenLinksEnabled(context: Context): Boolean {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      // Assuming default is false if not set
      return prefs.getBoolean(AUTO_OPEN_LINKS_KEY, false)
    }

    fun onReceiveNotification(payload: Map<String, Any?>) {
      val module = currentInstance?.get()

      if (module != null) {
        module.handleIncomingNotification(payload)
      } else {
        Log.w("ExpoRetenoSdk", "Module instance not found, dropping notification event")
      }
    }

    fun onClickNotification(payload: Map<String, Any?>) {
      val module = currentInstance?.get()

      if (module != null) {
          module.handleClickOnIncomingNotification(payload)
      } else {
          Log.w("ExpoRetenoSdk", "Module instance not found, dropping notification event")
      }
    }
  }

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoRetenoSdk')` in JavaScript.
    Name("ExpoRetenoSdk")

    Events(
        "onPushNotificationReceived",
        "onPushNotificationClicked",
        "onPushButtonClicked",
        "inAppCustomDataReceived",
        "beforeInAppDisplay",
        "onInAppDisplay",
        "beforeInAppClose",
        "afterInAppClose",
        "onInAppError",
        "unreadMessagesCount",
        "unreadMessagesCountError"
    )

    OnActivityResult { _, payload ->
      if (payload.requestCode == 1001) {
        runOnMainThread {
          if (payload.resultCode == android.app.Activity.RESULT_OK) {
            updatePushPermissionStatus()
          }
        }
      }
    }

    OnCreate {
      val ctx = appContext.reactContext
      if (ctx != null) {
          try {
              if (FirebaseApp.getApps(ctx).isEmpty()) {
                  FirebaseApp.initializeApp(ctx)
                  print("Initialized Firebase")
              }
          } catch (t: Throwable) {
            print("Cannot initialize Firebase")

          }
      }
    }

    // Push notifications
    AsyncFunction("registerForRemoteNotifications") { promise: Promise ->
      val ctx = appContext.reactContext ?: return@AsyncFunction
      val activity = appContext.currentActivity ?: return@AsyncFunction

      if (activity == null || ctx == null) {
        promise.reject(
          "ERR_NO_CONTEXT", 
          "Activity or Context is null",
            null
        )
      }

      CoroutineScope(Dispatchers.Main).launch {
        try {
          val isGranted = RetenoNotifications.requestNotificationPermission()

          if(isGranted) {
            updatePushPermissionStatus()
          } else if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Request permission natively
            activity.requestPermissions(arrayOf(permission), PERMISSION_REQUEST_CODE)
          }

          promise.resolve(InitResult().apply {
//            return@AsyncFunction mapOf("success" to true)
          })
        } catch (t: Throwable) {
          promise.reject("ERR_SDK_INIT", t.message, t)
        }
      }
    }

    AsyncFunction("getInitialNotification") { promise: Promise -> 
      val activity = appContext.currentActivity ?: return@AsyncFunction
      
      if(activity == null){
        promise.resolve(null);
          return@AsyncFunction ;
      }

      promise.resolve(
        parseIntent(
          activity.getIntent()
        )
      );
    } 

    // User information
    AsyncFunction("updateUserAttributes") { payload: RetenoUserAttributesPayload, promise: Promise ->
      try {
          // Map the custom fields
          val fields = payload.userAttributes?.fields?.map { f ->
              UserCustomField(key = f.key, value = f.value)
          } ?: emptyList()

          // Map the user attributes
          val userAttributes = UserAttributes(
              phone = getStringOrNull(payload.userAttributes?.phone),
              email = getStringOrNull(payload.userAttributes?.email),
              firstName = getStringOrNull(payload.userAttributes?.firstName),
              lastName = getStringOrNull(payload.userAttributes?.lastName),
              languageCode = getStringOrNull(payload.userAttributes?.languageCode),
              timeZone = getStringOrNull(payload.userAttributes?.timeZone),
              address = payload.userAttributes?.address?.let { addr ->
                  Address(
                      region = getStringOrNull(addr.region),
                      town = getStringOrNull(addr.town),
                      address = getStringOrNull(addr.address),
                      postcode = getStringOrNull(addr.postcode)
                  )
              },
              fields = fields
          )

          // Call the native Reteno SDK
          Reteno.instance.setUserAttributes(
              externalUserId = payload.externalUserId,
              user = User(
                  userAttributes = userAttributes,
                  subscriptionKeys = payload.subscriptionKeys ?: emptyList(),
                  groupNamesInclude = payload.groupNamesInclude ?: emptyList(),
                  groupNamesExclude = payload.groupNamesExclude ?: emptyList()
              ),
          )

          promise.resolve(mapOf("success" to true))

      } catch (e: Exception) {
        promise.reject("500", "Reteno Expo SDK Error", e) 
      }
    }

    AsyncFunction("updateAnonymousUserAttributes") { payload: RetenoAnonymousUserAttributes, promise: Promise ->
      try {
          // Map the custom fields
          val fields = payload.fields?.map { f ->
              UserCustomField(key = f.key, value = f.value)
          } ?: emptyList()

          // Map the user attributes
          val userAttributes = UserAttributesAnonymous(
              firstName = getStringOrNull(payload.firstName),
              lastName = getStringOrNull(payload.lastName),
              timeZone = getStringOrNull(payload.timeZone),
              languageCode = getStringOrNull(payload.languageCode),
              address = payload.address?.let { addr ->
                  Address(
                      region = getStringOrNull(addr.region),
                      town = getStringOrNull(addr.town),
                      address = getStringOrNull(addr.address),
                      postcode = getStringOrNull(addr.postcode)
                  ) },
              fields = fields
          )

          Reteno.instance.setAnonymousUserAttributes(userAttributes)
          promise.resolve(mapOf("success" to true))

      } catch (e: Exception) {
          // Passing the exception 'e' is good practice in Kotlin to retain the stack trace
          promise.reject("500", "Reteno Expo SDK Error", e)
      }
    }

    AsyncFunction("updateMultiAccountUserAttributes") { payload: RetenoMultiAccountUserAttributesPayload, promise: Promise ->
      try {
          // Map the custom fields
          val fields = payload.userAttributes?.fields?.map { f ->
              UserCustomField(key = f.key, value = f.value)
          } ?: emptyList()

          // Map the user attributes
          val userAttributes = UserAttributes(
              phone = getStringOrNull(payload.userAttributes?.phone),
              email = getStringOrNull(payload.userAttributes?.email),
              firstName = getStringOrNull(payload.userAttributes?.firstName),
              lastName = getStringOrNull(payload.userAttributes?.lastName),
              languageCode = getStringOrNull(payload.userAttributes?.languageCode),
              timeZone = getStringOrNull(payload.userAttributes?.timeZone),
              address = payload.userAttributes?.address?.let { addr ->
                  Address(
                      region = getStringOrNull(addr.region),
                      town = getStringOrNull(addr.town),
                      address = getStringOrNull(addr.address),
                      postcode = getStringOrNull(addr.postcode)
                  )
              },
              fields = fields
          )

          // Call the native Reteno SDK
          Reteno.instance.setMultiAccountUserAttributes(
              externalUserId = payload.externalUserId,
              user = User(
                  userAttributes = userAttributes,
                  subscriptionKeys = payload.subscriptionKeys ?: emptyList(),
                  groupNamesInclude = payload.groupNamesInclude ?: emptyList(),
                  groupNamesExclude = payload.groupNamesExclude ?: emptyList(),
              ),
          )

          promise.resolve(mapOf("success" to true))

      } catch (e: Exception) {
          // Passing the exception 'e' is good practice in Kotlin to retain the stack trace
          promise.reject("500", "Reteno Expo SDK Error", e)
      }
    }

      // User behaviour
      AsyncFunction("logEvent") { payload: ReadableMap, promise: Promise ->
          try {
              val activity = appContext.currentActivity ?: return@AsyncFunction

              if(activity == null){
                  promise.resolve(null);
                  return@AsyncFunction;
              }

              val event = RetenoEvent.buildEventFromPayload(payload)
              Reteno.instance.logEvent(event)

              val res: WritableMap = WritableNativeMap()
              res.putBoolean("success", true)
              promise.resolve(res)
          } catch (e: Exception) {
              promise.reject(
                  "500",
                  "Reteno Android SDK Error",
                  e
              );
              return@AsyncFunction;
          }
      }

      AsyncFunction("logScreenView") { screenName: String, promise: Promise ->
          try {
              val activity = appContext.currentActivity ?: return@AsyncFunction

              if(activity == null){
                  promise.resolve(null);
                  return@AsyncFunction;
              }

              val event = RetenoEvent.buildScreenViewEventFromPayload(screenName)

              Reteno.instance.logEvent(event)

              val res: WritableMap = WritableNativeMap()
              res.putBoolean("success", true)
              promise.resolve(res)
          } catch (e: Exception) {
              promise.reject(
                  "500",
                  "Reteno Android SDK Error",
                  e
              );
              return@AsyncFunction;
          }
      }

      AsyncFunction("forcePushData") { promise: Promise ->
          try {
              val activity = appContext.currentActivity ?: return@AsyncFunction

              if(activity == null){
                  promise.resolve(null);
                  return@AsyncFunction;
              }

              Reteno.instance.forcePushData()
              promise.resolve(true);
          } catch ( e: Exception) {
              promise.reject("500","Reteno Android SDK forcePushData Error", e);
          }
      }

      // Recommendations
      AsyncFunction("getRecommendations") { payload: ReadableMap, promise: Promise ->
          val activity = appContext.currentActivity
          if (activity == null) {
              promise.reject("ContextError", "Current activity is null", null)
              return@AsyncFunction
          }

          if (payload == null) {
              promise.reject("PayloadError", "Payload cannot be null", null)
              return@AsyncFunction
          }

          val recomVariantId =
              if (payload.hasKey("recomVariantId")) {
                  payload.getString("recomVariantId")
              } else null

          val productIdsArray = payload.getArray("productIds")
          val fieldsArray = payload.getArray("fields")
          val categoryId =
              if (payload.hasKey("categoryId")) payload.getString("categoryId") else null

          if (recomVariantId == null || productIdsArray == null || fieldsArray == null) {
              promise.reject("PayloadError", "Required fields are missing in the payload", null)
              return@AsyncFunction
          }

          val productIds: List<String> = convertReadableArrayToStringList(productIdsArray)
          val fields: List<String> = convertReadableArrayToStringList(fieldsArray)
          val request = RecomRequest(productIds, categoryId, fields, null)

          val retenoInstance = Reteno.instance

          retenoInstance.recommendation.fetchRecommendation(
              recomVariantId,
              request,
              RetenoRecommendationsResponse::class.java,
              object : GetRecommendationResponseCallback<RetenoRecommendationsResponse> {

                  override fun onSuccess(response: Recoms<RetenoRecommendationsResponse>) {
                      val recomsList = response.recoms.map { recom ->
                          mapOf(
                              "productId" to recom.productId,
                              "description" to recom.descr
                          )
                      }
                      promise.resolve(recomsList)
                  }

                  override fun onSuccessFallbackToJson(response: String) {
                      promise.resolve(response)
                  }

                  override fun onFailure(statusCode: Int?, response: String?, throwable: Throwable?) {
                      val code = statusCode?.toString() ?: "UNKNOWN_ERROR"
                      val message = response ?: "Failed to fetch recommendations"
                      promise.reject(code, message, throwable)
                  }
              }
          )
      }

      AsyncFunction("logRecommendationEvent") { payload: ReadableMap, promise: Promise ->
          try {
              val activity = appContext.currentActivity
              if (activity == null) {
                  promise.reject("LogRecommendationEventError", "Current activity is null", null)
                  return@AsyncFunction
              }

              val events = mutableListOf<RecomEvent>()

              val recomVariantId =
                  if (payload.hasKey("recomVariantId")) {
                      payload.getString("recomVariantId")
                  } else null;
              val impressionsArray =
                  if (payload.hasKey("impressions")) payload.getArray("impressions") else null
              val clicksArray = if (payload.hasKey("clicks")) payload.getArray("clicks") else null

              if (recomVariantId == null || impressionsArray == null || clicksArray == null) {
                  promise.reject("LogRecommendationEventError", "Required fields are missing in the payload", null);
                  return@AsyncFunction;
              }

              val impressions: List<String> = impressionsArray?.let { convertReadableArrayToStringList(it) } ?: emptyList()
              val clicks: List<String> = clicksArray?.let { convertReadableArrayToStringList(it) } ?: emptyList()


              impressions?.forEach { impression ->
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                      events.add(RecomEvent(RecomEventType.IMPRESSIONS, ZonedDateTime.now(), impression))
                  }
              }

              clicks?.forEach { click ->
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                      events.add(RecomEvent(RecomEventType.CLICKS, ZonedDateTime.now(), click))
                  }
              }

              val recomEvents = RecomEvents(recomVariantId, events)

              // 4. Fire the event
              val retenoInstance = Reteno.instance
              retenoInstance.recommendation.logRecommendations(recomEvents)

              promise.resolve(true)

          } catch (e: IllegalArgumentException) {
              promise.reject("InvalidEventType", "Invalid recommendation event type", e)
          } catch (e: Exception) {
              promise.reject("LogRecommendationError", "Reteno Android SDK logRecommendationEvent Error", e)
          }
      }

      // In-App messages
      AsyncFunction("pauseInAppMessages") { isPaused: Boolean, promise: Promise ->
          try {
              Reteno.instance.pauseInAppMessages(isPaused)
              promise.resolve(true)
          } catch (e: Exception) {
              promise.reject("PauseInAppMessagesError", "Reteno Android SDK pauseInAppMessages Error", e);
          }
      }

      AsyncFunction("setInAppLifecycleCallback") { promise: Promise ->
          try {
              appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              inAppLifecycleCallback = object : InAppLifecycleCallback {
                  override fun beforeDisplay(inAppData: InAppData) {
                      sendEvent("beforeInAppDisplay", mapOf(
                          "source" to inAppData.source.toString(),
                          "id" to inAppData.id
                      ))
                  }

                  override fun onDisplay(inAppData: InAppData) {
                      sendEvent("onInAppDisplay", mapOf(
                          "source" to inAppData.source.toString(),
                          "id" to inAppData.id
                      ))
                  }

                  override fun beforeClose(closeData: InAppCloseData) {
                      sendEvent("beforeInAppClose", mapOf(
                          "source" to closeData.source.toString(),
                          "id" to closeData.id,
                          "closeAction" to closeData.closeAction.toString()
                      ))
                  }

                  override fun afterClose(closeData: InAppCloseData) {
                      sendEvent("afterInAppClose", mapOf(
                          "source" to closeData.source.toString(),
                          "id" to closeData.id,
                          "closeAction" to closeData.closeAction.toString()
                      ))
                  }

                  override fun onError(errorData: InAppErrorData) {
                      sendEvent("onInAppError", mapOf(
                          "source" to errorData.source.toString(),
                          "id" to errorData.id,
                          "errorMessage" to errorData.errorMessage
                      ))
                  }
              }

              Reteno.instance.setInAppLifecycleCallback(inAppLifecycleCallback)
              promise.resolve(true)
          } catch(e: Exception) {
              promise.reject("InAppLifecycleError", "Reteno Android SDK setInAppLifecycleCallback Error", e)
          }
      }

      AsyncFunction("removeInAppLifecycleCallback") { promise: Promise ->
          try {
              inAppLifecycleCallback = null
              promise.resolve(true)
          } catch (e: Exception) {
              promise.reject("PauseInAppMessagesError", "Reteno Android SDK pauseInAppMessages Error", e);
          }
      }

      // App inbox messages
      AsyncFunction("getAppInboxMessages") { payload: ReadableMap, promise: Promise ->
          try {
              val activity = appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              val status =
                  if (payload.hasKey("status")) {
                      payload.getString("status")
                  } else null;

              val page =
                  if (payload.hasKey("page")) {
                      payload.getString("page")
                  } else null;

              val pageSize =
                  if (payload.hasKey("pageSize")) {
                      payload.getString("pageSize")
                  } else null;

              val inboxStatus = when (status?.uppercase()) {
                  "OPENED" -> AppInboxStatus.OPENED
                  "UNOPENED" -> AppInboxStatus.UNOPENED
                  else -> null
              }

              Reteno.instance.appInbox.getAppInboxMessages(
                  page as Int?,
                  pageSize as Int?,
                  inboxStatus,
                  object : RetenoResultCallback<AppInboxMessages> {

                      override fun onSuccess(result: AppInboxMessages) {
                          // 5. Transform the result using Kotlin's functional map
                          val messagesList = result.messages.map { message ->
                              mapOf(
                                  "id" to message.id,
                                  "title" to message.title,
                                  "createdDate" to message.createdDate,
                                  "isNew" to message.isNewMessage,
                                  "content" to message.content,
                                  "imageURL" to message.imageUrl,
                                  "linkURL" to message.linkUrl,
                                  "category" to message.category,
                                  "status" to message.status?.name
                              )
                          }

                          // 6. Return the final structured dictionary
                          promise.resolve(mapOf(
                              "messages" to messagesList,
                              "totalPages" to result.totalPages
                          ))
                      }

                      override fun onFailure(statusCode: Int?, response: String?, throwable: Throwable?) {
                          val code = statusCode?.toString() ?: "GetAppInboxMessagesError"
                          val errorMessage = response ?: "Reteno Android SDK getAppInboxMessages Error"
                          promise.reject(code, errorMessage, throwable)
                      }
                  }
              )

          } catch (e: Exception) {
              promise.reject("GetAppInboxMessagesError", "Reteno Android SDK getAppInboxMessages Error", e)
          }
      }

      AsyncFunction("getAppInboxMessagesCount") { promise: Promise ->
          try {
              appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              Reteno.instance.appInbox.getAppInboxMessagesCount(object : RetenoResultCallback<Int> {
                  override fun onFailure(
                      statusCode: Int?,
                      response: String?,
                      throwable: Throwable?
                  ) {
                      promise.reject(
                          "Reteno Android SDK getAppInboxMessagesCount Error",
                          response,
                          throwable
                      )
                  }

                  override fun onSuccess(result: Int) {
                      promise.resolve(result)
                  }
              })
          } catch (e: Exception) {
              promise.reject("GetAppInboxMessagesCountError", "Reteno Android SDK getAppInboxMessagesCount Error", e)
          }
      }

      AsyncFunction("markAsOpened") { messageId: String, promise: Promise ->
          try {
              appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              Reteno.instance.appInbox.markAsOpened(messageId)

              promise.resolve(true)
          } catch (e: Exception) {
              promise.reject("MarkAsOpenedError","Reteno Android SDK markAsOpened Error", e);
          }
      }

      AsyncFunction("markAllAsOpened") { promise: Promise ->
          appContext.currentActivity ?: run {
              promise.reject("ContextError", "Current activity is null", null)
              return@AsyncFunction
          }

          Reteno.instance.appInbox.markAllMessagesAsOpened(
              object : RetenoResultCallback<Unit> {

                  override fun onSuccess(result: Unit) {
                      promise.resolve(true)
                  }

                  override fun onFailure(statusCode: Int?, response: String?, throwable: Throwable?) {
                      val code = statusCode?.toString() ?: "MarkAllOpenedError"
                      val errorMessage = response ?: "Reteno Android SDK markAllAsOpened Error"

                      promise.reject(code, errorMessage, throwable)
                  }
              }
          )
      }

      AsyncFunction("unsubscribeAllMessagesCountChanged") { promise: Promise ->
        try {
            appContext.currentActivity ?: run {
                promise.reject("ContextError", "Current activity is null", null)
                return@AsyncFunction
            }

           Reteno.instance.appInbox.unsubscribeAllMessagesCountChanged()
           promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UnsubscribeAllMessagesCountChangedError", "Something went wrong", e)
        }
      }

      AsyncFunction("onUnreadMessagesCountChanged") { promise: Promise ->
          messagesCountChangedCallback = object : RetenoResultCallback<Int> {
              override fun onSuccess(count: Int) {
                  sendEvent("unreadMessagesCount", mapOf(
                      "count" to count
                  ))
              }

              override fun onFailure(statusCode: Int?, response: String?, throwable: Throwable?) {
                  sendEvent("unreadMessagesCountError", mapOf(
                      "statusCode" to statusCode,
                      "response" to response,
                      "error" to throwable
                  ))
              }
          }

          try {
              appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              Reteno.instance.appInbox.subscribeOnMessagesCountChanged(messagesCountChangedCallback as RetenoResultCallback<Int>);
              promise.resolve(null);
          } catch (e: Exception) {
              promise.reject("SubscriptionError", "Something went wrong", e);
          }
      }

      AsyncFunction("unsubscribeMessagesCountChanged") { promise: Promise ->
          if (messagesCountChangedCallback != null) {
              appContext.currentActivity ?: run {
                  promise.reject("ContextError", "Current activity is null", null)
                  return@AsyncFunction
              }

              Reteno.instance.appInbox.unsubscribeMessagesCountChanged(messagesCountChangedCallback!!);
              messagesCountChangedCallback = null;

              promise.resolve(null);
          } else {
              promise.reject("CallbackError", "No callback to unsubscribe", null);
          }
      }

      // Ecommerce events

      // Link handlers
      AsyncFunction("setAutoOpenLinks") { isEnabled: Boolean, promise: Promise ->
          val context = appContext.reactContext ?: run {
              promise.reject("ContextError", "React context is null", null)
              return@AsyncFunction
          }

          val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
          prefs.edit().putBoolean(AUTO_OPEN_LINKS_KEY, isEnabled).apply()

          promise.resolve(true)
      }

      AsyncFunction("getAutoOpenLinks") { promise: Promise ->
          val context = appContext.reactContext ?: run {
              promise.reject("ContextError", "React context is null", null)
              return@AsyncFunction
          }

          promise.resolve(isAutoOpenLinksEnabled(context))
      }
  }

  // Helper to safely run on main thread regardless of where we are called from
  private fun runOnMainThread(action: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      action()
    } else {
      Handler(Looper.getMainLooper()).post(action)
    }
  }

  private fun updatePushPermissionStatus() {
    try {
      Reteno.instance.updatePushPermissionStatus()
    } catch (t: Throwable) {
      print("Cannot update push notification permissions")
    }
  }

  private fun handleIncomingNotification(payload: Map<String, Any?>) {
    sendEvent("onPushNotificationReceived", mapOf(
      "type" to "reteno-push-received",
      "data" to payload,
      "timestamp" to System.currentTimeMillis()
    ))

  }

    private fun handleClickOnIncomingNotification(payload: Map<String, Any?>) {
        sendEvent("onPushNotificationClicked", mapOf(
            "type" to "reteno-push-clicked",
            "data" to payload,
            "timestamp" to System.currentTimeMillis()
        ))
    }

    private fun parseIntent(intent: Intent): WritableMap {
        val params = Arguments.createMap()
        val extras = intent.extras

        if (extras != null) {
            try {
                for (key in extras.keySet()) {
                    val value = extras[key]
                    if (value is HashMap<*, *>) {
                        val map: WritableMap = convertHashMap(value as HashMap<String, Any>)
                        params.putMap(key, map)
                    } else {
                        params.putString(key, value?.toString())
                    }
                }
            } catch (e: java.lang.Exception) {
                Log.e("parseIntent", "Error converting Bundle to WritableMap: " + e.message, e)
            }
        }

        return params
    }

    private fun convertHashMap(map: HashMap<String, Any>): WritableMap {
        val writableMap = Arguments.createMap()

        for ((key, value) in map) {
            if (value is String) {
                writableMap.putString(key, value)
            } else if (value is Int) {
                writableMap.putInt(key, value)
            } else if (value is Double) {
                writableMap.putDouble(key, value)
            } else if (value is Boolean) {
                writableMap.putBoolean(key, value)
            } else if (value is HashMap<*, *>) {
                val nestedMap = convertHashMap(value as HashMap<String, Any>)
                writableMap.putMap(key, nestedMap)
            } else {
                writableMap.putString(key, if (value != null) value.toString() else null)
            }
        }

        return writableMap
    }

    private fun convertReadableArrayToStringList(array: ReadableArray): List<String> {
        val list: MutableList<String> = ArrayList()
        for (i in 0..<array.size()) {
            array.getString(i)?.let { list.add(it) }
        }

        return list
    }
}


