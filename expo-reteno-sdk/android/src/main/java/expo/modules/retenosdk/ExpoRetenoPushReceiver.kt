package expo.modules.retenosdk;

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

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
  }
}

// import android.content.BroadcastReceiver;
// import android.content.Context;
// import android.content.Intent;
//
// public class ExpoRetenoPushReceiver extends BroadcastReceiver {
//   @Override
//   public void onReceive(Context context, Intent intent) {
//             // 1. Extract data from the intent (example logic)
//         val dataMap = mutableMapOf<String, Any?>()
//         
//         // Example: Extract extras bundle to a map
//         intent.extras?.keySet()?.forEach { key ->
//             val value = intent.extras?.get(key)
//             if (value != null) {
//                 dataMap[key] = value.toString()
//             }
//         }
//
//     ExpoRetenoSdkModule.handleIncomingNotification(context, intent);
//   }
// }
