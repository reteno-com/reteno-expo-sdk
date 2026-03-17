import {
  MergeResults,
  RetenoExtensionProps,
  RetenoInitConfig,
  RetenoInitConfigKeys,
  RetenoIOSAutogenComments,
  RetenoIOSProps,
} from "../types";
import { iosConfig } from "./constants";
import crypto from "crypto";
import path from "path";
import { FileService } from "./FileService";
import { ExportedConfigWithProps } from "expo/config-plugins";

// Returns update EAS Configuration
export default function getEasManagedCredentialsConfigExtra(config: any): {
  [k: string]: any;
} {
  return {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ??
                []),
              {
                // keep in sync with native changes in NSE
                targetName: iosConfig.nse.target,
                bundleIdentifier: `${config?.ios?.bundleIdentifier}.${iosConfig.nse.target}`,
                entitlements: {
                  "com.apple.security.application-groups": [
                    `group.${config?.ios?.bundleIdentifier}.reteno-local-storage`,
                  ],
                },
              },
              {
                targetName: iosConfig.nce.target,
                bundleIdentifier: `${config?.ios?.bundleIdentifier}.${iosConfig.nce.target}`,
                entitlements: {
                  "com.apple.security.application-groups": [
                    `group.${config?.ios?.bundleIdentifier}.reteno-local-storage`,
                  ],
                },
              },
            ],
          },
        },
      },
    },
  };
}

function createHash(src: string): string {
  // this doesn't need to be secure, the shorter the better.
  const hash = crypto.createHash("sha1").update(src).digest("hex");
  return `sync-${hash}`;
}

function createGeneratedHeaderComment(
  contents: string,
  tag: string,
  comment: string,
): string {
  const hashKey = createHash(contents);

  // Everything after the `${tag} ` is unversioned and can be freely modified without breaking changes.
  return `${comment} @generated begin ${tag} - expo prebuild (DO NOT MODIFY) ${hashKey}`;
}

function getGeneratedSectionIndexes(
  src: string,
  tag: string,
): { contents: string[]; start: number; end: number } {
  const contents = src.split("\n");
  const start = contents.findIndex((line) =>
    new RegExp(`@generated begin ${tag} -`).test(line),
  );
  const end = contents.findIndex((line) =>
    new RegExp(`@generated end ${tag}$`).test(line),
  );

  return { contents, start, end };
}

/**
 * Removes the generated section from a file, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made manually.
 *
 * @param src
 */
function removeGeneratedContents(src: string, tag: string): string | null {
  const { contents, start, end } = getGeneratedSectionIndexes(src, tag);
  if (start > -1 && end > -1 && start < end) {
    contents.splice(start, end - start + 1);
    // TODO: We could in theory check that the contents we're removing match the hash used in the header,
    // this would ensure that we don't accidentally remove lines that someone added or removed from the generated section.
    return contents.join("\n");
  }
  return null;
}

function addLines(
  content: string,
  find: string | RegExp,
  offset: number,
  toAdd: string[],
) {
  const lines = content.split("\n");

  let lineIndex = lines.findIndex((line) => line.match(find));
  if (lineIndex < 0) {
    const error = new Error(
      `Failed to match "${find}" in contents:\n${content}`,
    );
    // @ts-ignore
    error.code = "ERR_NO_MATCH";
    throw error;
  }
  for (const newLine of toAdd) {
    lines.splice(lineIndex + offset, 0, newLine);
    lineIndex++;
  }

  return lines.join("\n");
}

export function mergeContents({
  src,
  newSrc,
  tag,
  anchor,
  offset,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  anchor: string | RegExp;
  offset: number;
  comment: string;
}): MergeResults {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    return {
      contents: addLines(sanitizedTarget ?? src, anchor, offset, [
        header,
        ...newSrc.split("\n"),
        `\t${comment} @generated end ${tag}`,
      ]),
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
}

export function removeContents({
  src,
  tag,
}: {
  src: string;
  tag: string;
}): MergeResults {
  // Ensure the old generated contents are removed.
  const sanitizedTarget = removeGeneratedContents(src, tag);

  return {
    contents: sanitizedTarget ?? src,
    didMerge: false,
    didClear: !!sanitizedTarget,
  };
}

/**
 * @see https://github.com/expo/expo/blob/60aeb1eac8693841c7932e037afce6c96a5e8841/packages/%40expo/config-plugins/src/ios/Maps.ts#L50
 */
export function addFirebaseAppDelegateImport(src: string): MergeResults {
  const newSrc = ["#if canImport(Firebase)", "import Firebase", "#endif"];

  return mergeContents({
    tag: RetenoIOSAutogenComments.FIREBASE_IMPORT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: /(@main|@UIApplicationMain)/,
    offset: 0,
    comment: "//",
  });
}

/**
 * @see https://github.com/expo/expo/blob/60aeb1eac8693841c7932e037afce6c96a5e8841/packages/%40expo/config-plugins/src/ios/Maps.ts#L70
 */
export function addFirebaseAppDelegateInit(src: string): MergeResults {
  const newSrc = [
    "#if canImport(Firebase)",
    "\tFirebaseApp.configure()",
    "#endif",
  ];

  return mergeContents({
    tag: RetenoIOSAutogenComments.FIREBASE_INIT,
    src,
    newSrc: newSrc.join("\n"),
    anchor:
      /\bsuper\.application\(\w+?, didFinishLaunchingWithOptions: \w+?\)/g,
    offset: 0,
    comment: "//",
  });
}

export function addMessagingDelegate(
  src: string,
  service: "firebase" | "apns",
): MergeResults {
  if (service === "firebase") {
    // Settings extension
    const { contents } = mergeContents({
      tag: RetenoIOSAutogenComments.FIREBASE_MESSAGING_DELEGATE,
      src,
      newSrc: iosConfig.snippets.messaging.firebase.extension.join("\n"),
      anchor: /(@main|@UIApplicationMain)/,
      offset: 0,
      comment: "//",
    });

    // Settings APNs override
    return mergeContents({
      tag: RetenoIOSAutogenComments.RETENO_APNS,
      src: contents,
      newSrc: iosConfig.snippets.messaging.firebase.application.join("\n"),
      anchor: /public override func application/,
      offset: 0,
      comment: "//",
    });
  } else {
    return mergeContents({
      tag: RetenoIOSAutogenComments.RETENO_APNS,
      src,
      newSrc: iosConfig.snippets.messaging.apns.join("\n"),
      anchor: /public override func application/,
      offset: 0,
      comment: "//",
    });
  }
}

export function addRetenoImport(src: string): MergeResults {
  const newSrc = ["import Reteno"];

  return mergeContents({
    tag: RetenoIOSAutogenComments.RETENO_IMPORT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: /import Expo/,
    offset: 0,
    comment: "//",
  });
}

export function addRetenoInit(
  src: string,
  apiKey: string,
  config: RetenoInitConfig,
): MergeResults {
  const retenoConfigKeys = [
    "isAutomaticPushSubsriptionReportingEnabled",
    "isAutomaticSessionReportingEnabled",
    "isDebugMode",
  ];

  const configurationString = retenoConfigKeys
    .map((key) => {
      return `${key}: ${config[key as RetenoInitConfigKeys] ?? false}`;
    })
    .join(", ");

  const newSrc = [
    `\tlet configuration = RetenoConfiguration(${configurationString})`,
    `\tReteno.start(apiKey: "${apiKey}", configuration: configuration)`,
  ];

  return mergeContents({
    tag: RetenoIOSAutogenComments.RETENO_INIT,
    src,
    newSrc: newSrc.join("\n"),
    anchor:
      /\bsuper\.application\(\w+?, didFinishLaunchingWithOptions: \w+?\)/g,
    offset: 0,
    comment: "//",
  });
}

// Function installs pods through iteration
export async function addDependenciesToPodfile(
  path: string,
  pods: Record<"name" | "addon", string>[],
  anchor: string,
) {
  const podfile = await FileService.read(`${path}/Podfile`);

  if (!podfile.includes(anchor)) {
    throw new Error("Anchor was not found");
  }

  const updates = [];

  for (const p of pods) {
    // TODO: Check if commented
    if (podfile.includes(`pod '${p.name}'`)) {
      console.log(`Pod ${p} already exists, skipping...`);
      continue;
    } else {
      updates.push(`pod '${p.name}'${p.addon !== "" ? ", " + p.addon : ""}`);
    }
  }

  const contents = podfile.replace(
    anchor,
    `${anchor}\n\t${updates.join("\n\t")}
  `,
  );

  await FileService.write(`${path}/Podfile`, contents);
}

// Function adds target to Podfile
export async function addTargetToPodfile(
  path: string,
  target: string,
  snippet: "service" | "content",
) {
  let podfile = await FileService.read(`${path}/Podfile`);

  if (podfile.includes(`target '${target}' do`)) {
    console.log(`Target "${target}" was added before, skipping process...`);
    return;
  }

  podfile += iosConfig.snippets[snippet === "service" ? "nse" : "nce"];

  await FileService.write(`${path}/Podfile`, podfile);
}

async function updateExtensionEntitlements(
  extension: "service" | "content",
  path: string,
  groupIdentifier: string,
  filtering?: boolean,
): Promise<void> {
  let entitlementsFile = await FileService.read(path);

  entitlementsFile = entitlementsFile.replaceAll(
    /{{GROUP_IDENTIFIER}}/gm,
    groupIdentifier,
  );

  if (filtering && extension === "service") {
    const filteringKey = `  <key>com.apple.developer.usernotifications.filtering</key>\n  <true/>`;
    entitlementsFile = entitlementsFile.replace(
      "</dict>",
      `${filteringKey}\n</dict>`,
    );
  }

  await FileService.write(path, entitlementsFile);
}

async function updateExtensionBundleVersions(
  path: string,
  config: Record<"shortVersion" | "version", string>,
): Promise<void> {
  let file = await FileService.read(path);

  file = file.replace(/{{BUNDLE_SHORT_VERSION}}/gm, config.shortVersion);
  file = file.replace(/{{BUNDLE_VERSION}}/gm, config.version);

  await FileService.write(path, file);
}

export async function copyExtensionFiles(
  config: ExportedConfigWithProps,
  iosConfig: any,
  sourceDir: string,
  iosConfigKey: "nce" | "nse",
  filepathFromProps?: string,
) {
  const iosPath = path.join(config.modRequest.projectRoot, "ios");

  const { defaultBundleVersions } = iosConfig;
  const { target, files, source, infoPlist } = iosConfig[iosConfigKey];

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
  const sourcePath = filepathFromProps ?? `${sourceDir}/${source}`;
  const targetFile = `${destPath}/${source}`;
  await FileService.copy(`${sourcePath}`, targetFile);

  if (iosConfig[iosConfigKey].entitlements) {
    await updateExtensionEntitlements(
      "service",
      `${destPath}/${iosConfig[iosConfigKey].entitlements}`,
      String(config.ios?.bundleIdentifier),
    );
  }

  await updateExtensionBundleVersions(`${destPath}/${infoPlist}`, {
    shortVersion: config.ios?.buildNumber ?? defaultBundleVersions.shortVersion,
    version: config.ios?.version ?? defaultBundleVersions.version,
  });

  return config;
}

export function addNotificationServiceExtensionTarget(
  config: any,
  newConfig: ExportedConfigWithProps,
  props?: RetenoIOSProps & RetenoExtensionProps,
) {
  const xcodeProject = newConfig.modResults;
  const { targetedDeviceFamily, deploymentTarget } = iosConfig;
  const { target, files, source, infoPlist } = iosConfig.nse;

  if (!!xcodeProject.pbxTargetByName(target)) {
    console.warn(`${target} already exists in project. Skipping...`);
    return newConfig;
  }

  // Create new PBXGroup for the extension
  const extGroup = xcodeProject.addPbxGroup([...files, source], target, target);

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
  projObjects["PBXTargetDependency"] = projObjects["PBXTargetDependency"] || {};
  projObjects["PBXContainerItemProxy"] =
    projObjects["PBXContainerItemProxy"] || {};

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

  const configurations = xcodeProject.pbxXCBuildConfigurationSection();
  for (const key in configurations) {
    if (
      typeof configurations[key].buildSettings !== "undefined" &&
      configurations[key].buildSettings.PRODUCT_NAME == `"${target}"` &&
      configurations[key].buildSettings
    ) {
      const { buildSettings } = configurations[key];

      buildSettings.INFOPLIST_FILE = `"${target}/${infoPlist}"`;
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

      const appVersion = config.version ? config.version : "1.0.0";
      const buildNumber = config.ios?.buildNumber
        ? config.ios.buildNumber
        : "1";

      buildSettings.MARKETING_VERSION = `"${appVersion}"`;
      buildSettings.CURRENT_PROJECT_VERSION = `"${buildNumber}"`;

      // Force the correct prefixed Bundle Identifier
      buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${config.ios?.bundleIdentifier}.${target}"`;
      buildSettings.GENERATE_INFOPLIST_FILE = "YES";
      buildSettings.INFOPLIST_KEY_CFBundleDisplayName = `"${target}"`;
    }
  }

  // Add development teams to both your target and the original project
  xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam, nseTarget);
  xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

  return newConfig;
}

export function addNotificationContentExtensionTarget(
  config: any,
  newConfig: ExportedConfigWithProps,
  props?: RetenoIOSProps & RetenoExtensionProps,
) {
  const xcodeProject = newConfig.modResults;

  const { targetedDeviceFamily, deploymentTarget } = iosConfig;
  const { target, files, source, infoPlist, entitlements } = iosConfig.nce;

  // Idempotency check
  if (!!xcodeProject.pbxTargetByName(target)) {
    console.warn(`${target} already exists in project. Skipping...`);
    return newConfig;
  }

  // Create new PBXGroup for the extension
  const extGroup = xcodeProject.addPbxGroup([...files, source], target, target);

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
  const projObjects = xcodeProject.hash.project.objects;
  projObjects["PBXTargetDependency"] = projObjects["PBXTargetDependency"] || {};
  projObjects["PBXContainerItemProxy"] =
    projObjects["PBXContainerItemProxy"] || {};

  // Add the NCE target
  const nceTarget = xcodeProject.addTarget(
    target,
    "app_extension",
    target,
    `${config.ios?.bundleIdentifier}.${target}`,
  );

  // Link NCE source file to target
  xcodeProject.addBuildPhase(
    [source],
    "PBXSourcesBuildPhase",
    "Sources",
    nceTarget.uuid,
  );

  // Add build phases to the new target
  xcodeProject.addBuildPhase(
    [],
    "PBXResourcesBuildPhase",
    "Resources",
    nceTarget.uuid,
  );

  // Content Extensions generally require UserNotificationsUI.framework
  // You can pass ["UserNotificationsUI.framework"] inside the array if your build requires explicit linking.
  xcodeProject.addBuildPhase(
    [],
    "PBXFrameworksBuildPhase",
    "Frameworks",
    nceTarget.uuid,
  );

  xcodeProject.addFramework("UserNotifications.framework", {
    target: nceTarget.uuid,
  });
  xcodeProject.addFramework("UserNotificationsUI.framework", {
    target: nceTarget.uuid,
  });

  const configurations = xcodeProject.pbxXCBuildConfigurationSection();
  for (const key in configurations) {
    if (
      typeof configurations[key].buildSettings !== "undefined" &&
      configurations[key].buildSettings.PRODUCT_NAME == `"${target}"` &&
      configurations[key].buildSettings
    ) {
      const { buildSettings } = configurations[key];

      buildSettings.INFOPLIST_FILE = `"${target}/${infoPlist}"`;
      buildSettings.DEVELOPMENT_TEAM = props?.devTeam;
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
        props?.deploymentTarget ?? deploymentTarget;
      buildSettings.TARGETED_DEVICE_FAMILY = targetedDeviceFamily;
      buildSettings.CODE_SIGN_ENTITLEMENTS = `"${target}/${entitlements}"`;
      buildSettings.CODE_SIGN_STYLE = "Automatic";
      buildSettings.SWIFT_VERSION = "5.0";
      buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
      buildSettings.SKIP_INSTALL = "YES";

      const appVersion = config.version ? config.version : "1.0.0";
      const buildNumber = config.ios?.buildNumber
        ? config.ios.buildNumber
        : "1";

      buildSettings.MARKETING_VERSION = `"${appVersion}"`;
      buildSettings.CURRENT_PROJECT_VERSION = `"${buildNumber}"`;

      buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${config.ios?.bundleIdentifier}.${target}"`;
      buildSettings.GENERATE_INFOPLIST_FILE = "YES";
      buildSettings.INFOPLIST_KEY_CFBundleDisplayName = `"${target}"`;
    }
  }

  // Add development teams to both your target and the original project
  xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam, nceTarget);
  xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

  return newConfig;
}
