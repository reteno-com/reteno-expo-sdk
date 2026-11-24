package expo.modules.retenosdk

import android.content.Context
import android.util.Log
import androidx.startup.Initializer
import androidx.work.Configuration
import androidx.work.WorkManager

/**
 * TEMPORARY WORKAROUND — remove once the Reteno Android SDK initializes WorkManager
 * synchronously itself (regression introduced in com.reteno:core 2.11.0).
 *
 * `com.reteno:core` removes the default `WorkManagerInitializer` from the manifest and, since 2.11.0,
 * initializes WorkManager asynchronously (BootSdkAction, queued on the main scope). When the system
 * cold-starts the process only to run a WorkManager job, `SystemJobService.onCreate()` can run first
 * and crash with:
 *   IllegalStateException: WorkManager needs to be initialized via a ContentProvider#onCreate()
 *   or an Application#onCreate().
 *
 * This initializer runs through androidx.startup before Application.onCreate() in every process and
 * only initializes WorkManager. It does not touch the Reteno configuration, so options passed from JS
 * `Reteno.initialize()` are unaffected. If WorkManager is already initialized (e.g. by the host app),
 * it is a no-op.
 */
class ExpoRetenoWorkManagerInitializer : Initializer<WorkManager> {
  override fun create(context: Context): WorkManager {
    try {
      WorkManager.initialize(
        context,
        Configuration.Builder().setMinimumLoggingLevel(Log.INFO).build()
      )
    } catch (_: IllegalStateException) {
      // Already initialized by the host app or another initializer.
    }
    return WorkManager.getInstance(context)
  }

  override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
