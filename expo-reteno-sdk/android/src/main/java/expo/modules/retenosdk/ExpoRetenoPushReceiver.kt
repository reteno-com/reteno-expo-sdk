package expo.modules.retenosdk;

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.reteno.push.events.NotificationReceived

class ExpoRetenoPushReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
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
      ExpoRetenoSdkModule.onReceiveNotification(dataMap)
    } catch (e: Exception) {
      Log.e("ExpoRetenoPushReceiver", "Failed to forward notification to module", e)
    }

    // This receiver replaces the native SDK's own PushReceivedReceiver (via the
    // com.reteno.Receiver.PushReceived meta-data override in withRetenoAndroid.ts), so
    // RetenoNotifications.received would otherwise never fire. Re-dispatch it manually.
    NotificationReceived.notifyListeners(intent.extras ?: Bundle())
  }
}

// package expo.modules.retenosdk;
//
// import android.content.BroadcastReceiver;
// import android.content.Context;
// import android.content.Intent;
//
// public class RetenoPushReceiver extends BroadcastReceiver {
//   @Override
//   public void onReceive(Context context, Intent intent) {
//     ExpoRetenoSdkModule.onRetenoPushReceived(context, intent);
//   }
// }
