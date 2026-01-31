package expo.modules.retenosdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

import android.os.Build
import android.app.Application
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.widget.Toast
import android.net.Uri
import android.Manifest
import android.os.Handler
import android.os.Looper

import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

import com.reteno.core.Reteno
import com.reteno.core.RetenoConfig
import com.reteno.push.RetenoNotifications

class ExpoRetenoSdkModule : Module() {

  val permission = Manifest.permission.POST_NOTIFICATIONS
  val PERMISSION_REQUEST_CODE = 1001

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoRetenoSdk')` in JavaScript.
    Name("ExpoRetenoSdk")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("start") { key: String ->
      val ctx = appContext.reactContext ?: return@Function
      val activity = appContext.currentActivity ?: return@Function

      if (activity == null || ctx == null) {
        return@Function
      }

      activity.runOnUiThread {
        try {

        Reteno.initWithConfig(
          RetenoConfig.Builder().accessKey(key).build()
        )      

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          if (ContextCompat.checkSelfPermission(ctx, permission) == PackageManager.PERMISSION_GRANTED) {
            // Already have permission
            updatePushPermissionStatus()
          } else {
            // Request permission natively
            activity.requestPermissions(arrayOf(permission), PERMISSION_REQUEST_CODE)
          }
        } else {
          // Below API 33, notifications are granted by default
          updatePushPermissionStatus()
        }
        } catch (t: Throwable) {
          t.printStackTrace()
        }
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
      t.printStackTrace()
    }
  }

}
