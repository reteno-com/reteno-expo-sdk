import {
  ConfigPlugin,
  withInfoPlist,
  withEntitlementsPlist,
} from "expo/config-plugins";

// import * as path from "path";
// import getEasManagedCredentialsConfigExtra, {
//   updatePodfile,
//   createServiceExtensionFiles,
//   updateServiceExtensionEntitlements,
//   generateUuid,
// } from "./support/functions";
// import {
//   IOS_DEPLOYMENT_TARGET,
//   IOS_NSE_CONFIG,
//   TARGETED_DEVICE_FAMILY,
// } from "./support/constants";
// import { FileService } from "./support/FileService";
// import assert from "assert";

export type RetenoIOS = {
  devTeam: string;
  appGroups: string[];
  mode: "development" | "production";
  NSEFilePath?: string;
  iPhoneDeploymentTarget?: string;
};

const withAppEnvironment = (config: any, props: RetenoIOS) => {
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

// FIXME: Does not work because embeded target problem
//
// Update Podfile with Notification Service Extension
// const withPodfileUpdate = (config: any) => {
//   return withDangerousMod(config, [
//     "ios",
//     async (config) => {
//       const root = path.join(config.modRequest.projectRoot, "ios");
//
//       // Notification Service Extension
//       updatePodfile(root).catch((err) => {
//         console.error(err);
//       });
//
//       return config;
//     },
//   ]);
// };
//
// const withNotificationServiceExtension = (config: any, props: RetenoIOS) => {
//   return withDangerousMod(config, [
//     "ios",
//     async (config) => {
//       const rootDir = config.modRequest.projectRoot;
//
//       // support for monorepos where node_modules can be above the project directory.
//       const pluginDir = require.resolve("expo-reteno-sdk/package.json", {
//         paths: [rootDir],
//       });
//
//       const cleanPluginDir = pluginDir.replace("/package.json", "");
//       const sourceDir = path.join(
//         cleanPluginDir,
//         "plugin/ios/NotificationServiceExtension/",
//       );
//
//       const { target, source, files } = IOS_NSE_CONFIG;
//
//       const iosPath = path.join(rootDir, "ios");
//       const folderName = `${iosPath}/${target}`;
//
//       /* COPY OVER EXTENSION FILES */
//       FileService.createFolder(folderName, { recursive: true });
//       createServiceExtensionFiles(files, folderName, sourceDir);
//
//       const sourcePath = props.NSEFilePath ?? `${sourceDir}/${source}`;
//       const targetFile = `${iosPath}/${target}/${source}`;
//
//       await FileService.copy(sourcePath, targetFile);
//       await updateServiceExtensionEntitlements(
//         `${cleanPluginDir}/plugin/ios/NotificationServiceExtension`,
//         `group.${config.ios?.bundleIdentifier}.reteno`,
//       );
//
//       return config;
//     },
//   ]);
// };
//
// const withEmbedNSE = (config: any) => {
//   return withDangerousMod(config, [
//     "ios",
//     async (cfg) => {
//       const iosDir = cfg.modRequest.platformProjectRoot;
//       const pbxPath = path.join(
//         iosDir,
//         `exporetenosdkexample.xcodeproj/project.pbxproj`,
//       );
//
//       let pbxContents = await FileService.read(pbxPath);
//
//       if (!pbxContents.includes("Embed App Extensions")) {
//         const phase = `
// /* Begin PBXCopyFilesBuildPhase section */
//   ${generateUuid()} /* Embed App Extensions */ = {
//     isa = PBXCopyFilesBuildPhase;
//     buildActionMask = 2147483647;
//     dstPath = "";
//     dstSubfolderSpec = 13;
//     files = (
//     );
//     name = "Embed App Extensions";
//     runOnlyForDeploymentPostprocessing = 0;
//   };
// /* End PBXCopyFilesBuildPhase section */
// `;
//
//         // Append phase safely (you can improve placement later)
//         pbxContents = pbxContents.replace(
//           /\n\/\* End PBXCopyFilesBuildPhase section \*\//,
//           `${phase}\n/* End PBXCopyFilesBuildPhase section */`,
//         );
//       }
//
//       // 3️⃣ Add your Notification Service Extension product reference
//       // (replace YOURNSE.appex with your actual product file)
//       if (!pbxContents.includes("NotificationServiceExtension.appex")) {
//         const fileLine = `${generateUuid()} /* NotificationServiceExtension.appex */,`;
//
//         pbxContents = pbxContents.replace(
//           /files = \(\n\s*\);/,
//           `files = (\n${fileLine});`,
//         );
//       }
//
//       await FileService.write(pbxPath, pbxContents);
//       return cfg;
//     },
//   ]);
// };

// const withXcodeProjectUpdate = (config: any, props: RetenoIOS) => {
//   return withXcodeProject(config, (newConfig: any) => {
//     const { target, files, source } = IOS_NSE_CONFIG;
//     const xcodeProject = newConfig.modResults;
//
//     if (!!xcodeProject.pbxTargetByName(target)) {
//       console.warn(`${target} already exists in project. Skipping...`);
//       return newConfig;
//     }
//
//     // Create new PBXGroup for the extension
//     // const extGroup = xcodeProject.addPbxGroup([...NSE_EXT_FILES, NSE_SOURCE_FILE], NSE_TARGET_NAME, NSE_TARGET_NAME);
//     const extGroup = xcodeProject.addPbxGroup(files, target, target);
//
//     // Add the new PBXGroup to the top level group. This makes the
//     // files / folder appear in the file explorer in Xcode.
//     const groups = xcodeProject.hash.project.objects["PBXGroup"];
//     Object.keys(groups).forEach(function (key) {
//       if (
//         typeof groups[key] === "object" &&
//         groups[key].name === undefined &&
//         groups[key].path === undefined
//       ) {
//         xcodeProject.addToPbxGroup(extGroup.uuid, key);
//       }
//     });
//
//     // WORK AROUND for codeProject.addTarget BUG
//     // Xcode projects don't contain these if there is only one target
//     // An upstream fix should be made to the code referenced in this link:
//     //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
//     const projObjects = xcodeProject.hash.project.objects;
//     projObjects["PBXTargetDependency"] =
//       projObjects["PBXTargetDependency"] || {};
//     projObjects["PBXContainerItemProxy"] =
//       projObjects["PBXTargetDependency"] || {};
//
//     // Add the NSE target
//     // This adds PBXTargetDependency and PBXContainerItemProxy for you
//     const nseTarget = xcodeProject.addTarget(
//       target,
//       "app_extension",
//       target,
//       `${config.ios?.bundleIdentifier}.${target}`,
//     );
//
//     // console.log("[NSE]", nseTarget);
//
//     // Add build phases to the new target
//     xcodeProject.addBuildPhase(
//       [source],
//       "PBXSourcesBuildPhase",
//       "Sources",
//       nseTarget.uuid,
//     );
//
//     xcodeProject.addBuildPhase(
//       [],
//       "PBXResourcesBuildPhase",
//       "Resources",
//       nseTarget.uuid,
//     );
//
//     xcodeProject.addBuildPhase(
//       [],
//       "PBXFrameworksBuildPhase",
//       "Frameworks",
//       nseTarget.uuid,
//     );
//
//     // const appTarget = getApplicationTarget(xcodeProject);
//     // const configs = getBuildConfigsForTarget(xcodeProject, appTarget);
//     // embedExtension(xcodeProject, appTarget.id, nseTarget.pbxNativeTarget);
//
//     // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
//     // However, can be more
//     const configurations = xcodeProject.pbxXCBuildConfigurationSection();
//     for (const key in configurations) {
//       if (
//         typeof configurations[key].buildSettings !== "undefined" &&
//         configurations[key].buildSettings.PRODUCT_NAME == `"${target}"`
//       ) {
//         const bs = configurations[key].buildSettings;
//
//         bs.DEVELOPMENT_TEAM = props?.devTeam;
//         bs.IPHONEOS_DEPLOYMENT_TARGET =
//           props?.iPhoneDeploymentTarget ?? IOS_DEPLOYMENT_TARGET;
//         bs.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
//         bs.CODE_SIGN_ENTITLEMENTS = `${target}/${target}.entitlements`;
//         bs.CODE_SIGN_STYLE = "Automatic";
//         bs.SWIFT_VERSION = "5.0";
//
//         // console.log("[code_sign]", bs.CODE_SIGN_ENTITLEMENTS);
//       }
//     }
//
//     // Add development teams to both your target and the original project
//     xcodeProject.addTargetAttribute(
//       "DevelopmentTeam",
//       props?.devTeam,
//       nseTarget,
//     );
//     xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);
//
//     return newConfig;
//   });
// };

// const withEasManagedCredentials = (config: any) => {
//   assert(
//     config.ios?.bundleIdentifier,
//     "Missing 'ios.bundleIdentifier' in app config.",
//   );
//
//   config.extra = getEasManagedCredentialsConfigExtra(config);
//
//   return config;
// };

export const withRetenoIOS: ConfigPlugin<RetenoIOS> = (config, props) => {
  config = withAppEnvironment(config, props);
  config = withRemoteNotificationsPermissions(config);
  config = withAppGroups(config, props.appGroups);

  // FIXME: Does not work because of embeded target problem
  // config = withPodfileUpdate(config);
  // config = withEmbedNSE(config);
  // config = withNotificationServiceExtension(config, props);
  // config = withXcodeProjectUpdate(config, props);
  // config = withEasManagedCredentials(config);

  return config;
};
