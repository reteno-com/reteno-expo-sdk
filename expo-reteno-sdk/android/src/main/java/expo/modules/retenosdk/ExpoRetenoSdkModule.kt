package expo.modules.retenosdk

import RetenoAnonymousUserAttributes
import RetenoMultiAccountUserAttributesPayload
import expo.modules.kotlin.Promise
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import java.lang.ref.WeakReference

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

import android.os.Build
import android.Manifest
import android.os.Handler
import android.os.Looper
import android.util.Log

import RetenoUserAttributesPayload
import com.reteno.core.domain.model.user.Address
import com.reteno.core.domain.model.user.UserAttributes
import com.reteno.core.domain.model.user.UserCustomField
import com.reteno.core.Reteno
import com.reteno.push.RetenoNotifications

import com.google.firebase.FirebaseApp
import com.reteno.core.domain.model.user.User
import com.reteno.core.domain.model.user.UserAttributesAnonymous

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

  init {
    currentInstance = WeakReference(this)
  }

  // This `companion object` is for static access from BroadcastReceiver
  companion object {
    private var currentInstance: WeakReference<ExpoRetenoSdkModule>? = null

    fun onReceiveNotification(payload: Map<String, Any?>) {
      val module = currentInstance?.get()

      if (module != null) {
        module.handleIncomingNotification(payload)
      } else {
        // If the app is killed or module isn't loaded, you might want to 
        // handle this differently (e.g. show a local notification manually)
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

    Events("onPushNotificationReceived")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    AsyncFunction("registerForRemoteNotifications") { promise: Promise ->
      val ctx = appContext.reactContext ?: return@AsyncFunction
      val activity = appContext.currentActivity ?: return@AsyncFunction

      if (activity == null || ctx == null) {
        promise.reject("ERR_NO_CONTEXT", "Activity or Context is null", null)
        return@AsyncFunction
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
            // ...
          })
        } catch (t: Throwable) {
          promise.reject("ERR_SDK_INIT", t.message, t)
        }
      }
    }

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
        // Passing the exception 'e' is good practice in Kotlin to retain the stack trace
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

              // Call the native Reteno SDK
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

    // Listen for the result natively
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
    // Send the event to JS
    sendEvent("onPushNotificationReceived", mapOf(
      "type" to "reteno-push-received",
      "data" to payload,
      "timestamp" to System.currentTimeMillis()
    ))
  }
}
