package expo.modules.retenosdk

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.URLUtil
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

class RetenoCustomReceiverInAppData : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val extras = intent.extras ?: return
        val url = extras.getString("url")

        dispatchCustomData(extras)

        // Assuming isAutoOpenLinksEnabled is now a companion object function in RetenoModule
        if (!url.isNullOrEmpty() && URLUtil.isValidUrl(url) && ExpoRetenoSdkModule.isAutoOpenLinksEnabled(context)) {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))

            if (context !is Activity) {
                browserIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(browserIntent)
        }
    }

    private fun dispatchCustomData(extras: Bundle) {
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
        eventData.putString("source", "inAppMessage")

        // Keep this receiver as the single Android producer for the JS event. It can
        // enqueue the event before JavaScript registers its first handler.
        RetenoEventQueue.getInstance().dispatch(
            "reteno-in-app-custom-data-received",
            eventData,
            ExpoRetenoSdkModule.getSharedReactContext()
        )
    }
}
