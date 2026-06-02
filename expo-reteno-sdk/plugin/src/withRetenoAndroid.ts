import {
  AndroidConfig,
  ConfigPlugin,
  withAppBuildGradle,
  withAndroidManifest,
  withGradleProperties,
  withMainApplication,
  withProjectBuildGradle,
} from "expo/config-plugins";
import {
  addCompileOptions,
  addGoogleServicesPlugin,
  addModuleGradleDependencies,
  addGradleProperties,
  addProjectGradleDependencies,
  addSdkAndFirebaseImports,
  initializeSdk,
} from "./support/android.functions";
import { RetenoAndroidProps } from "./types";

const CLICKED_METADATA_NAME = "com.reteno.Receiver.NotificationClicked";
const PUSH_RECEIVED_METADATA_NAME = "com.reteno.Receiver.PushReceived";
const CLICK_RECEIVER_NAME = "expo.modules.retenosdk.ExpoRetenoClickReceiver";
const PUSH_RECEIVER_NAME = "expo.modules.retenosdk.ExpoRetenoPushReceiver";

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

const withProjectGradleDependencies: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (cfg: any) => {
    if (cfg.modResults.language === "groovy") {
      cfg.modResults.contents = addProjectGradleDependencies(
        cfg.modResults.contents,
      );
    } else {
      console.warn(
        "[android.googleServicesFile] Cannot automatically configure project build.gradle if it's not groovy",
      );
    }

    return cfg;
  });
};

const withModuleGradleDependencies: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (cfg: any) => {
    if (cfg.modResults.language === "groovy") {
      cfg.modResults.contents = addModuleGradleDependencies(
        cfg.modResults.contents,
      );
      cfg.modResults.contents = addGoogleServicesPlugin(cfg.modResults.contents);
    } else {
      console.warn(
        "[android.googleServicesFile] Cannot automatically configure app build.gradle if it's not groovy",
      );
    }

    return cfg;
  });
};

const withAppGradleProperties: ConfigPlugin = (config) => {
  return withGradleProperties(config, (cfg: any) => {
    let properties = cfg.modResults;

    properties = addGradleProperties(properties);

    return cfg;
  });
};

const withAppCompileOptions: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (cfg: any) => {
    cfg.modResults.contents = addCompileOptions(cfg.modResults.contents);

    return cfg;
  });
};

const withAppMainActivity: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  return withMainApplication(config, (config) => {
    config.modResults.contents = addSdkAndFirebaseImports(
      config.modResults.contents,
      config.modResults.language,
    );
    config.modResults.contents = initializeSdk(
      config.modResults.contents,
      props,
    );

    return config;
  });
};

export const withRetenoAndroid: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  config = withRetenoAndroidManifest(config);
  config = withProjectGradleDependencies(config);
  config = withModuleGradleDependencies(config);
  config = withAppGradleProperties(config);
  config = withAppCompileOptions(config);
  config = withAppMainActivity(config, props);

  return config;
};
