import {
  ConfigPlugin,
  withInfoPlist,
  withEntitlementsPlist,
  withDangerousMod,
  withAppDelegate,
  withXcodeProject,
} from "expo/config-plugins";
import { RetenoIOSAutogenComments, RetenoIOSProps } from "./types";
import {
  addRetenoImport,
  addFirebaseAppDelegateImport,
  addFirebaseAppDelegateInit,
  addMessagingDelegate,
  updatePodfile,
  removeContents,
  addRetenoInit,
} from "./support/ios.functions";
import path from "path";

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
        buildConfig.buildSettings["DEVELOPMENT_TEAM"] = devTeam;
        buildConfig.buildSettings["CODE_SIGN_STYLE"] = "Automatic";

        // Optional: If you want to force the development team for the target specifically
        // buildConfig.buildSettings['PROVISIONING_PROFILE_SPECIFIER'] = '';
      }
    }

    return config;
  });
};

const withAppEnvironment = (config: any, props: RetenoIOSProps) => {
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

      await updatePodfile(
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
    throw new Error("SDK token is not defined, cancelling installation...");
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

    config.modResults.contents = addRetenoInit(config.modResults.contents, {
      apiKey: props.sdkAccessToken,
      isDebugMode: props.debug,
    }).contents;

    return config;
  });
};

export const withRetenoIOS: ConfigPlugin<RetenoIOSProps> = (config, props) => {
  config = withDevelopmentTeam(config, props);
  config = withAppEnvironment(config, props);
  config = withRemoteNotificationsPermissions(config);
  config = withAppGroups(config, props.appGroups);
  config = withRetenoInit(config, props);

  if (props.notificationService === "firebase") {
    config = withFirebasePodfileUpdate(config);
  }

  config = withAppDelegateConfiguration(config, props);

  return config;
};
