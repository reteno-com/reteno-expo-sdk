package expo.modules.retenosdk

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.URLUtil
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap

class RetenoCustomReceiverInAppData : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val extras = intent.extras ?: return
        val url = extras.getString("url")

        handleCustomData(extras, context)

        // Assuming isAutoOpenLinksEnabled is now a companion object function in RetenoModule
        if (!url.isNullOrEmpty() && URLUtil.isValidUrl(url) && ExpoRetenoSdkModule.isAutoOpenLinksEnabled(context)) {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))

            if (context !is Activity) {
                browserIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(browserIntent)
        }
    }

    private fun handleCustomData(extras: Bundle, context: Context) {
        val eventData: WritableMap = Arguments.createMap()
        val customDataMap: WritableMap = Arguments.createMap()

        val coreKeys = setOf("inapp_id", "inapp_source", "url")

        for (key in extras.keySet()) {
            val value = extras.get(key) ?: continue

            val targetMap = if (key in coreKeys) eventData else customDataMap

            when (value) {
                is String -> targetMap.putString(key, value)
                is Int -> targetMap.putInt(key, value)
                is Boolean -> targetMap.putBoolean(key, value)
                is Double -> targetMap.putDouble(key, value)
            }
        }

        eventData.putMap("customData", customDataMap)

        var ctx: Context? = null

        try {
            val app = context.applicationContext as? RetenoReactNativeApplication
            ctx = app?.reactContext
        } catch (e: Exception) {
            // Log but continue - event will be queued by your RetenoEventQueue
        }

        RetenoEventQueue.getInstance().dispatch(
            "inAppCustomDataReceived",
            eventData,
            ctx as ReactContext?
        )
    }
}