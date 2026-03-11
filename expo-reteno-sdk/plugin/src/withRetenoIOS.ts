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
} from "./types";
import {
  addRetenoImport,
  addFirebaseAppDelegateImport,
  addFirebaseAppDelegateInit,
  addMessagingDelegate,
  addDependenciesToPodfile,
  removeContents,
  addRetenoInit,
  updateExtensionEntitlements,
  updateExtensionBundleVersions,
  addTargetToPodfile,
} from "./support/ios.functions";
import path from "path";
import { FileService } from "./support/FileService";
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

    config.modResults.contents = addRetenoInit(
      config.modResults.contents,
      props.sdkAccessToken,
      {
        isDebugMode: props.debug,
      },
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
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      const { defaultBundleVersions, nse: nseConfig } = iosConfig;
      const { target, files, source, entitlements, infoPlist } = nseConfig;

      const destPath = `${iosPath}/${target}`;

      FileService.createFolder(`${iosPath}/${target}`, {
        recursive: true,
      });

      // Copy Plists and Entitlements
      for (let i = 0; i < files.length; i++) {
        const extFile = files[i];
        const targetFile = `${destPath}/${extFile}`;

        await FileService.copy(`${sourceDir}/${extFile}`, targetFile);
      }

      // Copy NotificationServiceExtension.swift
      const sourcePath = props.nseFilepath ?? `${sourceDir}/${source}`;
      const targetFile = `${destPath}/${source}`;
      await FileService.copy(`${sourcePath}`, targetFile);

      await updateExtensionEntitlements(
        "service",
        `${destPath}/${entitlements}`,
        String(config.ios?.bundleIdentifier),
      );

      await updateExtensionBundleVersions(`${destPath}/${infoPlist}`, {
        shortVersion:
          config.ios?.buildNumber ?? defaultBundleVersions.shortVersion,
        version: config.ios?.version ?? defaultBundleVersions.version,
      });

      return config;
    },
  ]);
};

const withNotificationServiceExtensionTarget: ConfigPlugin<
  RetenoIOSProps & RetenoExtensionProps
> = (config, props) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;
    const { targetedDeviceFamily, deploymentTarget } = iosConfig;
    const { target, files, source } = iosConfig.nse;

    if (!!xcodeProject.pbxTargetByName(target)) {
      console.warn(`${target} already exists in project. Skipping...`);
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...files, source],
      target,
      target,
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the NSE target
    // This adds PBXTargetDependency and PBXContainerItemProxy
    const nseTarget = xcodeProject.addTarget(
      target,
      "app_extension",
      target,
      `${config.ios?.bundleIdentifier}.${target}`,
    );

    // Link NSE file to target
    xcodeProject.addBuildPhase(
      [source],
      "PBXSourcesBuildPhase",
      "Sources",
      nseTarget.uuid,
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      nseTarget.uuid,
    );

    // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
    // However, can be more
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${target}"` &&
        configurations[key].buildSettings
      ) {
        const { buildSettings } = configurations[key];

        buildSettings.INFOPLIST_FILE = `"NotificationServiceExtension/Info.plist"`;
        buildSettings.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
          props?.deploymentTarget ?? deploymentTarget;
        buildSettings.TARGETED_DEVICE_FAMILY = targetedDeviceFamily;
        buildSettings.CODE_SIGN_ENTITLEMENTS = `${target}/${target}.entitlements`;
        buildSettings.CODE_SIGN_STYLE = "Automatic";
        buildSettings.SWIFT_VERSION = "5.0";

        // Optional: Ensure it's treated as an extension
        buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
        buildSettings.SKIP_INSTALL = "YES";

        if (config.version) {
          buildSettings.MARKETING_VERSION = `"${config.version}"`;
        }
        if (config.ios?.buildNumber) {
          buildSettings.CURRENT_PROJECT_VERSION = `"${config.ios.buildNumber}"`;
        }

        // Force the correct prefixed Bundle Identifier
        // buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${config.ios?.bundleIdentifier}.NotificationServiceExtension`;
      }
    }

    // Add development teams to both your target and the original project
    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      nseTarget,
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    return newConfig;
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

/**
 * Add Notification Content Extension
 */
const withNotificationContentExtension: ConfigPlugin<RetenoExtensionProps> = (
  config,
  props,
) => {
  const pluginDir = require.resolve("expo-reteno-sdk/package.json");
  const sourceDir = path.join(pluginDir, "../plugin/src/support/nce");

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      const { defaultBundleVersions, nce: nceConfig } = iosConfig;
      const { target, files, source, entitlements, infoPlist } = nceConfig;

      const destPath = `${iosPath}/${target}`;

      FileService.createFolder(`${iosPath}/${target}`, {
        recursive: true,
      });

      // Copy Plists and Entitlements
      for (let i = 0; i < files.length; i++) {
        const extFile = files[i];
        const targetFile = `${destPath}/${extFile}`;

        await FileService.copy(`${sourceDir}/${extFile}`, targetFile);
      }

      // Copy NotificationContentExtension.swift
      const sourcePath = props.nceFilepath ?? `${sourceDir}/${source}`;
      const targetFile = `${destPath}/${source}`;
      await FileService.copy(`${sourcePath}`, targetFile);

      await updateExtensionEntitlements(
        "content",
        `${destPath}/${entitlements}`,
        String(config.ios?.bundleIdentifier),
      );

      await updateExtensionBundleVersions(`${destPath}/${infoPlist}`, {
        shortVersion:
          config.ios?.buildNumber ?? defaultBundleVersions.shortVersion,
        version: config.ios?.version ?? defaultBundleVersions.version,
      });

      return config;
    },
  ]);
};

const withNotificationContentExtensionTarget: ConfigPlugin<
  RetenoIOSProps & RetenoExtensionProps
> = (config, props) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;
    const { targetedDeviceFamily, deploymentTarget } = iosConfig;
    const { target, files, source } = iosConfig.nce;

    if (!!xcodeProject.pbxTargetByName(target)) {
      console.warn(`${target} already exists in project. Skipping...`);
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...files, source],
      target,
      target,
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the NSE target
    // This adds PBXTargetDependency and PBXContainerItemProxy
    const extTarget = xcodeProject.addTarget(
      target,
      "app_extension",
      target,
      `${config.ios?.bundleIdentifier}.${target}`,
    );

    // Link NSE file to target
    xcodeProject.addBuildPhase(
      [source],
      "PBXSourcesBuildPhase",
      "Sources",
      extTarget.uuid,
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      extTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      extTarget.uuid,
    );

    // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
    // However, can be more
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${target}"` &&
        configurations[key].buildSettings
      ) {
        const { buildSettings } = configurations[key];

        buildSettings.INFOPLIST_FILE = `"${target}/Info.plist"`;
        buildSettings.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
          props?.deploymentTarget ?? deploymentTarget;
        buildSettings.TARGETED_DEVICE_FAMILY = targetedDeviceFamily;
        buildSettings.CODE_SIGN_ENTITLEMENTS = `${target}/${target}.entitlements`;
        buildSettings.CODE_SIGN_STYLE = "Automatic";
        buildSettings.SWIFT_VERSION = "5.0";

        // Optional: Ensure it's treated as an extension
        buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
        buildSettings.SKIP_INSTALL = "YES";

        if (config.version) {
          buildSettings.MARKETING_VERSION = `"${config.version}"`;
        }
        if (config.ios?.buildNumber) {
          buildSettings.CURRENT_PROJECT_VERSION = `"${config.ios.buildNumber}"`;
        }
      }
    }

    // Add development teams to both your target and the original project
    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      extTarget,
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    return newConfig;
  });
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

  config = withNotificationContentExtensionTarget(
    config,
    props as RetenoIOSProps & RetenoExtensionProps,
  );

  config = withNotificationContentExtensionPodfileUpdate(config);

  // if (props.notificationService === "firebase") {
  //   config = withFirebasePodfileUpdate(config);
  // }

  config = withAppDelegateConfiguration(config, props);

  return config;
};
