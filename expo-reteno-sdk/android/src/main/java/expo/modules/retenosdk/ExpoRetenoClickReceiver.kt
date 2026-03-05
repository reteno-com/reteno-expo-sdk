package expo.modules.retenosdk;

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class ExpoRetenoClickReceiver : BroadcastReceiver() {
  override fun onClick(context: Context, intent: Intent) {
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
