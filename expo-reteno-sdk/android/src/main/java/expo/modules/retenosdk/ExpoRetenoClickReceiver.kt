package expo.modules.retenosdk;

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log

class ExpoRetenoClickReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    // Registering this receiver in the manifest's NotificationClicked meta-data replaces
    // Reteno's own click receiver, which is what normally drives NotificationClick listeners
    // (e.g. RetenoNotificationSummaryManager). Notify it ourselves so those listeners still fire.
    RetenoNotificationSummaryManager.notifyClickListeners(intent.extras ?: Bundle.EMPTY)

    // Extract data from the intent
    val dataMap = mutableMapOf<String, Any?>()

    // Extract extras bundle to a map
    intent.extras?.keySet()?.forEach { key ->
      val value = intent.extras?.get(key)

      if (value != null) {
        dataMap[key] = value.toString()
      }
    }

    try {
      ExpoRetenoSdkModule.onClickNotification(dataMap)
    } catch (e: Exception) {
      Log.e("ExpoRetenoPushReceiver", "Failed to forward notification to module", e)
    }
  }
}
