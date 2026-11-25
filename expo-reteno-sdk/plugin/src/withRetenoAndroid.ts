import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "expo/config-plugins";
import { RetenoAndroidProps } from "./types";

const CLICKED_METADATA_NAME = "com.reteno.Receiver.NotificationClicked";
const PUSH_RECEIVED_METADATA_NAME = "com.reteno.Receiver.PushReceived";
const CLICK_RECEIVER_NAME = "expo.modules.retenosdk.ExpoRetenoClickReceiver";
const PUSH_RECEIVER_NAME = "expo.modules.retenosdk.ExpoRetenoPushReceiver";
const SDK_ACCESS_KEY_METADATA = "com.reteno.SDK_ACCESS_KEY";
const IS_DEBUG_MODE_METADATA = "com.reteno.IS_DEBUG_MODE";
const NOTIFICATION_ICON_METADATA = "com.reteno.notification_icon";
const NOTIFICATION_ICON_COLOR_METADATA = "com.reteno.notification_icon_color";

const addRetenoMetaData = (
  mainApplication: AndroidConfig.Manifest.ManifestApplication,
  name: string,
  value: string,
) => {
  // Remove first to clear any stale attributes (e.g. android:resource instead of android:value)
  AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(
    mainApplication,
    name,
  );
  AndroidConfig.Manifest.addMetaDataItemToMainApplication(
    mainApplication,
    name,
    value,
  );
  const metaData = mainApplication["meta-data"] ?? [];
  const targetItem = metaData.find((item) => item.$["android:name"] === name);

  if (targetItem) {
    targetItem.$["tools:node"] = "replace";
  }
};

const withRetenoAndroidManifest: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );

    addRetenoMetaData(
      mainApplication,
      CLICKED_METADATA_NAME,
      CLICK_RECEIVER_NAME,
    );
    addRetenoMetaData(
      mainApplication,
      PUSH_RECEIVED_METADATA_NAME,
      PUSH_RECEIVER_NAME,
    );
    AndroidConfig.Manifest.ensureToolsAvailable(cfg.modResults);

    const appReceivers = mainApplication.receiver ?? [];
    const hasClickReceiver = appReceivers.some(
      (receiver) => receiver.$["android:name"] === CLICK_RECEIVER_NAME,
    );
    const hasPushReceiver = appReceivers.some(
      (receiver) => receiver.$["android:name"] === PUSH_RECEIVER_NAME,
    );

    if (!hasClickReceiver) {
      appReceivers.push({
        $: {
          "android:name": CLICK_RECEIVER_NAME,
          "android:exported": "false",
        },
      });
    }

    if (!hasPushReceiver) {
      appReceivers.push({
        $: {
          "android:name": PUSH_RECEIVER_NAME,
          "android:exported": "false",
        },
      });
    }

    mainApplication.receiver = appReceivers;

    return cfg;
  });
};

const withRetenoAndroidSDKKey: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  return withAndroidManifest(config, (cfg) => {
    const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    // Always remove both keys so removing sdkAccessToken from plugin config
    // and re-running prebuild correctly disables auto-init (Path A → Path B).
    AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, SDK_ACCESS_KEY_METADATA);
    AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, IS_DEBUG_MODE_METADATA);
    if (props.sdkAccessToken) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, SDK_ACCESS_KEY_METADATA, props.sdkAccessToken);
      if (props.config?.isDebugMode) {
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, IS_DEBUG_MODE_METADATA, "true");
      }
    }
    return cfg;
  });
};

// The Reteno SDK builds its notifications itself and reads the small icon and its color only
// from these two meta-data keys. It ignores the Firebase / expo-notifications icon keys.
const withRetenoAndroidNotificationIcon: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  return withAndroidManifest(config, (cfg) => {
    const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    // Always remove both keys so removing the props and re-running prebuild restores the default icon.
    AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, NOTIFICATION_ICON_METADATA);
    AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, NOTIFICATION_ICON_COLOR_METADATA);
    if (props.notificationIcon) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, NOTIFICATION_ICON_METADATA, props.notificationIcon, "resource");
    }
    if (props.notificationIconColor) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, NOTIFICATION_ICON_COLOR_METADATA, props.notificationIconColor, "resource");
    }
    return cfg;
  });
};

/**
 * Google Services (classpath, `com.google.gms.google-services` plugin and copying
 * `google-services.json`) is configured by Expo itself when `android.googleServicesFile`
 * is set in the app config. The Reteno plugin intentionally does not modify Gradle files.
 *
 * Only a warning is printed when the option is missing, so apps that configure
 * Google Services manually in their native project keep working.
 */
const warnIfGoogleServicesFileMissing: ConfigPlugin = (config) => {
  if (!config.android?.googleServicesFile) {
    console.warn(
      "[expo-reteno-sdk] `android.googleServicesFile` is not set in the app config. " +
        "Firebase Cloud Messaging requires Google Services: set `android.googleServicesFile` " +
        "(e.g. \"./google-services.json\") so Expo configures it during prebuild, " +
        "or configure Google Services manually in your native Android project.",
    );
  }
  return config;
};

export const withRetenoAndroid: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  config = warnIfGoogleServicesFileMissing(config);
  config = withRetenoAndroidManifest(config);
  config = withRetenoAndroidSDKKey(config, props);
  config = withRetenoAndroidNotificationIcon(config, props);

  return config;
};
