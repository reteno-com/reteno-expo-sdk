import {
  ConfigPlugin,
  withInfoPlist,
  withEntitlementsPlist,
  withDangerousMod,
  withAppDelegate,
  withXcodeProject,
} from "expo/config-plugins";
import {
  RetenoIOSAutogenComments,
  RetenoIOSProps,
  RetenoExtensionProps,
  RetenoExtensionTarget,
} from "./types";
import {
  addRetenoImport,
  addFirebaseAppDelegateImport,
  addFirebaseAppDelegateInit,
  addMessagingDelegate,
  addDependenciesToPodfile,
  removeContents,
  addRetenoInit,
  addTargetToPodfile,
  copyExtensionFiles,
  addNotificationServiceExtensionTarget,
  addNotificationContentExtensionTarget,
} from "./support/ios.functions";
import path from "path";
import { iosConfig } from "./support/constants";

const withDevelopmentTeam: ConfigPlugin<RetenoIOSProps> = (config, props) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const { devTeam } = props;

    if (!devTeam) {
      console.warn(
        "No Development ID was found in `app.json`. Skipping this step...",
      );
      return config;
    }

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildConfig = configurations[key];

      if (typeof buildConfig === "object" && buildConfig.buildSettings) {
        const { buildSettings } = buildConfig;

        buildSettings["DEVELOPMENT_TEAM"] = devTeam;
        buildSettings["CODE_SIGN_STYLE"] = "Automatic";

        // Optional: If you want to force the development team for the target specifically
        // buildConfig.buildSettings['PROVISIONING_PROFILE_SPECIFIER'] = '';
      }
    }

    return config;
  });
};

const withAppEnvironment: ConfigPlugin<RetenoExtensionProps> = (
  config,
  props,
) => {
  return withEntitlementsPlist(config, (cfg: any) => {
    if (props?.mode == null) {
      throw new Error(`
        Missing required "mode" key in your app.json or app.config.js file for "onesignal-expo-plugin".
        "mode" can be either "development" or "production".
        Please see onesignal-expo-plugin's README.md for more details.`);
    }

    cfg.modResults["aps-environment"] = props.mode;

    // Add an app group, if needed
    // newConfig.modResults["com.apple.security.application-groups"] ||= [];
    //
    // if (
    //   !config.modResults["com.apple.security.application-groups"].includes(
    //     `group.${config?.ios?.bundleIdentifier}`,
    //   )
    // ) {
    //   config.modResults["com.apple.security.application-groups"].push(
    //     `group.${config?.ios?.bundleIdentifier}`,
    //   );
    // }

    return cfg;
  });
};

const withRemoteNotificationsPermissions = (config: any) => {
  const bgModes = ["remote-notification"];

  return withInfoPlist(config, (cfg) => {
    if (!Array.isArray(cfg.modResults.UIBackgroundModes)) {
      cfg.modResults.UIBackgroundModes = [];
    }

    for (const key of bgModes) {
      if (!cfg.modResults.UIBackgroundModes.includes(key)) {
        cfg.modResults.UIBackgroundModes.push(key);
      }
    }

    return cfg;
  });
};

/**
 * Add "App Group" capability
 * @see 'https://docs.reteno.com/reference/react-native-ios-sdk#step-5-add-app-groups'
 */
const withAppGroups = (config: any, groups: string[]) => {
  const APP_GROUP_KEY = "com.apple.security.application-groups";

  return withEntitlementsPlist(config, (cfg: any) => {
    if (!Array.isArray(cfg.modResults[APP_GROUP_KEY])) {
      cfg.modResults[APP_GROUP_KEY] = [];
    }

    const existing = cfg.modResults[APP_GROUP_KEY] as Array<any>;
    const entitlement = `group.${cfg?.ios?.bundleIdentifier || ""}.reteno`;

    if (existing.indexOf(entitlement) !== -1) {
      return cfg;
    }

    cfg.modResults[APP_GROUP_KEY] = Array.from(
      new Set([...existing, ...groups]),
    );

    return cfg;
  });
};

// Import Firebase at the top of AppDelegate.swift
// TODO: Optimize it
const withAppDelegateConfiguration: ConfigPlugin<RetenoIOSProps> = (
  config,
  props,
) => {
  return withAppDelegate(config, (config) => {
    // Remove last used APNs service
    config.modResults.contents = removeContents({
      src: config.modResults.contents,
      tag: RetenoIOSAutogenComments.RETENO_APNS,
    }).contents;

    if (props.notificationService === "firebase") {
      // Firebase flow
      // NOTE: delete Firebase imports first
      config.modResults.contents = removeContents({
        src: config.modResults.contents,
        tag: RetenoIOSAutogenComments.FIREBASE_IMPORT,
      }).contents;

      config.modResults.contents = removeContents({
        src: config.modResults.contents,
        tag: RetenoIOSAutogenComments.FIREBASE_INIT,
      }).contents;

      config.modResults.contents = removeContents({
        src: config.modResults.contents,
        tag: RetenoIOSAutogenComments.FIREBASE_MESSAGING_DELEGATE,
      }).contents;

      // NOTE: then re-install them
      config.modResults.contents = addFirebaseAppDelegateImport(
        config.modResults.contents,
      ).contents;
      addFirebaseAppDelegateInit;

      config.modResults.contents = addFirebaseAppDelegateInit(
        config.modResults.contents,
      ).contents;

      config.modResults.contents = addMessagingDelegate(
        config.modResults.contents,
        "firebase",
      ).contents;
    } else {
      // APNS flow
      config.modResults.contents = addMessagingDelegate(
        config.modResults.contents,
        "apns",
      ).contents;
    }

    return config;
  });
};

const withFirebasePodfileUpdate: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const root = path.join(config.modRequest.projectRoot, "ios");

      await addDependenciesToPodfile(
        root,
        [
          { name: "Firebase", addon: ":modular_headers => true" },
          { name: "FirebaseCore", addon: ":modular_headers => true" },
          { name: "FirebaseCoreExtension", addon: ":modular_headers => true" },
          { name: "FirebaseCoreInternal", addon: ":modular_headers => true" },
          { name: "FirebaseInstallations", addon: ":modular_headers => true" },
          { name: "FirebaseMessaging", addon: ":modular_headers => true" },
          { name: "GoogleDataTransport", addon: ":modular_headers => true" },
          { name: "GoogleUtilities", addon: ":modular_headers => true" },
        ],
        `use_expo_modules!`,
      ).catch((err) => {
        console.error(err);
      });

      return config;
    },
  ]);
};

const withRetenoInit: ConfigPlugin<RetenoIOSProps> = (config, props) => {
  if (!props.sdkAccessToken) {
    throw new Error(
      "[Reteno] SDK token is not defined, cancelling installation...",
    );
  }

  return withAppDelegate(config, (config) => {
    config.modResults.contents = removeContents({
      src: config.modResults.contents,
      tag: RetenoIOSAutogenComments.RETENO_IMPORT,
    }).contents;

    config.modResults.contents = removeContents({
      src: config.modResults.contents,
      tag: RetenoIOSAutogenComments.RETENO_INIT,
    }).contents;

    config.modResults.contents = addRetenoImport(
      config.modResults.contents,
    ).contents;

    config.modResults.contents = addRetenoInit(
      config.modResults.contents,
      props.sdkAccessToken,
      props.config,
    ).contents;

    return config;
  });
};

/**
 * Add Notification Service Extension
 */
const withNotificationServiceExtension: ConfigPlugin<RetenoExtensionProps> = (
  config,
  props,
) => {
  const pluginDir = require.resolve("expo-reteno-sdk/package.json");
  const sourceDir = path.join(pluginDir, "../plugin/src/support/nse");

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      config = await copyExtensionFiles(
        config,
        iosConfig,
        sourceDir,
        "nse",
        props.nseFilepath,
      );

      return config;
    },
  ]);
};

const withNotificationServiceExtensionTarget: ConfigPlugin<
  RetenoExtensionTarget
> = (config, props) => {
  return withXcodeProject(config, (newConfig) => {
    return addNotificationServiceExtensionTarget(config, newConfig, props);
  });
};

const withNotificationServiceExtensionPodfileUpdate: ConfigPlugin = (
  config,
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const root = path.join(config.modRequest.projectRoot, "ios");
      await addTargetToPodfile(root, iosConfig.nse.source, "service");

      return config;
    },
  ]);
};

const withNotificationContentExtensionPodfileUpdate: ConfigPlugin = (
  config,
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const root = path.join(config.modRequest.projectRoot, "ios");
      await addTargetToPodfile(root, iosConfig.nce.source, "content");

      return config;
    },
  ]);
};

/**
 * Add Notification Content Extension
 */
const withNotificationContentExtension: ConfigPlugin<RetenoExtensionProps> = (
  config,
) => {
  const pluginDir = require.resolve("expo-reteno-sdk/package.json");
  const sourceDir = path.join(pluginDir, "../plugin/src/support/nce");

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      config = await copyExtensionFiles(config, iosConfig, sourceDir, "nce");

      return config;
    },
  ]);
};

const withNotificationContentExtensionTarget: ConfigPlugin = (config) => {
  return withXcodeProject(config, (newConfig) => {
    return addNotificationContentExtensionTarget(config, newConfig);
  });
};

export const withRetenoIOS: ConfigPlugin<RetenoIOSProps> = (config, props) => {
  config = withDevelopmentTeam(config, props);
  config = withAppEnvironment(
    config,
    props as RetenoIOSProps & RetenoExtensionProps,
  );
  config = withRemoteNotificationsPermissions(config);
  config = withAppGroups(config, props.appGroups);
  config = withRetenoInit(config, props);

  // Notification Service Extension
  config = withNotificationServiceExtension(
    config,
    props as RetenoIOSProps & RetenoExtensionProps,
  );

  config = withNotificationServiceExtensionTarget(
    config,
    props as RetenoIOSProps & RetenoExtensionProps,
  );

  config = withNotificationServiceExtensionPodfileUpdate(config);

  // Notification Content Extensions
  config = withNotificationContentExtension(
    config,
    props as RetenoIOSProps & RetenoExtensionProps,
  );

  config = withNotificationContentExtensionTarget(config);

  config = withNotificationContentExtensionPodfileUpdate(config);

  if (props.notificationService === "firebase") {
    config = withFirebasePodfileUpdate(config);
  }

  config = withAppDelegateConfiguration(config, props);

  return config;
};
