import {
  MergeResults,
  RetenoExtensionProps,
  RetenoInitConfig,
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

  const matches = lines.filter((line) => line.match(find)).length;
  if (matches !== 1) {
    const error = new Error(
      `[expo-reteno-sdk] Expected exactly one match for ${find}, found ${matches}. ` +
        "The native template has an unexpected shape; the Reteno config plugin cannot " +
        "apply its changes safely. Run `npx expo prebuild --clean` or report the issue " +
        "with your Expo SDK version.",
    );
    // @ts-ignore
    error.code = "ERR_NO_MATCH";
    throw error;
  }
  let lineIndex = lines.findIndex((line) => line.match(find));
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
 * AppDelegate anchors. Each must match exactly one line in every supported
 * template (Expo SDK 54–58, incl. 57 with scene support) — see plugin/__fixtures__/ANCHORS.md.
 */
export const APP_DELEGATE_ANCHORS = {
  /** `@main` (55+) or `@UIApplicationMain` (54). */
  main: /^\s*@(main|UIApplicationMain)\s*$/,
  /** `import Expo` (54) or `internal import Expo` (55+); never `import ExpoRetenoSdk`. */
  importExpo: /^\s*(?:(?:internal|public|package)\s+)?import\s+Expo\s*$/,
  /** AppDelegate class declaration; new methods are inserted right after it. */
  classDeclaration: /^\s*(?:public\s+)?class\s+AppDelegate\s*:\s*ExpoAppDelegate\b/,
  /**
   * Present in classic (54–57) and scene-based (57 + enableSceneSupport, 58) templates.
   * Code inserted after it runs before `factory.startReactNative` (classic) and before
   * the scene connects / React Native starts (scene-based).
   */
  reactNativeFactoryAssignment: /^\s*reactNativeFactory\s*=\s*factory\s*$/,
  /** `return super.application(application, didFinishLaunchingWithOptions: launchOptions)`. */
  didFinishLaunchingReturn:
    /\breturn\s+super\.application\(\w+,\s*didFinishLaunchingWithOptions:\s*\w+\)/,
} as const;

/**
 * @see https://github.com/expo/expo/blob/60aeb1eac8693841c7932e037afce6c96a5e8841/packages/%40expo/config-plugins/src/ios/Maps.ts#L50
 */
export function addFirebaseAppDelegateImport(src: string): MergeResults {
  const newSrc = ["#if canImport(Firebase)", "import Firebase", "#endif"];

  return mergeContents({
    tag: RetenoIOSAutogenComments.FIREBASE_IMPORT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: APP_DELEGATE_ANCHORS.main,
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
    '\tif Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") == nil {',
    '\t\tprint("[Reteno] GoogleService-Info.plist is missing. Firebase push is disabled.")',
    "\t} else {",
    "\t\tif FirebaseApp.app() == nil {",
    "\t\t\tFirebaseApp.configure()",
    "\t\t}",
    "\t\tMessaging.messaging().delegate = self",
    "\t\tMessaging.messaging().token { token, _ in",
    "\t\t\tguard let token = token else { return }",
    "\t\t\tReteno.userNotificationService.processRemoteNotificationsToken(token)",
    "\t\t}",
    "\t}",
    "#endif",
  ];

  return mergeContents({
    tag: RetenoIOSAutogenComments.FIREBASE_INIT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: APP_DELEGATE_ANCHORS.didFinishLaunchingReturn,
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
      anchor: APP_DELEGATE_ANCHORS.main,
      offset: 0,
      comment: "//",
    });

    // Settings APNs override
    return mergeContents({
      tag: RetenoIOSAutogenComments.RETENO_APNS,
      src: contents,
      newSrc: iosConfig.snippets.messaging.firebase.application.join("\n"),
      anchor: APP_DELEGATE_ANCHORS.classDeclaration,
      offset: 1,
      comment: "//",
    });
  } else {
    return mergeContents({
      tag: RetenoIOSAutogenComments.RETENO_APNS,
      src,
      newSrc: iosConfig.snippets.messaging.apns.join("\n"),
      anchor: APP_DELEGATE_ANCHORS.classDeclaration,
      offset: 1,
      comment: "//",
    });
  }
}

export function addRetenoImport(src: string): MergeResults {
  // Mirror the access level of the template's `import Expo` line. Expo SDK 55+ templates use
  // `internal import Expo`, and expo-modules-autolinking generates `internal import <Module>`
  // (incl. `internal import ExpoRetenoSdk`) in ExpoModulesProvider.swift. Swift rejects importing
  // the same module with an implicit access level elsewhere in the target
  // ("ambiguous implicit access level for import of 'ExpoRetenoSdk'").
  const accessLevel =
    src.match(/^\s*(internal|public|package)\s+import\s+Expo\s*$/m)?.[1] ?? "";
  const prefix = accessLevel ? `${accessLevel} ` : "";
  const newSrc = [`${prefix}import Reteno`, `${prefix}import ExpoRetenoSdk`];

  return mergeContents({
    tag: RetenoIOSAutogenComments.RETENO_IMPORT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: APP_DELEGATE_ANCHORS.importExpo,
    offset: 0,
    comment: "//",
  });
}

export function addRetenoInit(
  src: string,
  _apiKey: string,
  _config: RetenoInitConfig,
): MergeResults {
  const newSrc = [
    "\tReteno.userNotificationService.didReceiveNotificationResponseHandler = { response in",
    "\t\tExpoRetenoSdkModule.storePendingInitialNotification(",
    "\t\t\tresponse.notification.request.content.userInfo",
    "\t\t)",
    "\t}",
    "\tExpoRetenoSdkModule.delayedStart()",
  ];

  return mergeContents({
    tag: RetenoIOSAutogenComments.RETENO_INIT,
    src,
    newSrc: newSrc.join("\n"),
    anchor: APP_DELEGATE_ANCHORS.reactNativeFactoryAssignment,
    offset: 1,
    comment: "//",
  });
}

/**
 * Firebase pods required by the AppDelegate Firebase integration
 * (`import Firebase`, `FirebaseApp.configure()`, `Messaging`).
 */
export const FIREBASE_PODS = [
  "Firebase",
  "FirebaseCore",
  "FirebaseCoreExtension",
  "FirebaseCoreInternal",
  "FirebaseInstallations",
  "FirebaseMessaging",
  "GoogleDataTransport",
  "GoogleUtilities",
] as const;

const firebasePodLine = (name: string) =>
  `pod '${name}', :modular_headers => true`;

const PODFILE_ANCHOR = /^\s*use_expo_modules!/;

/**
 * Plugin versions < 3.0.0 inserted the Firebase pods as plain lines directly after
 * `use_expo_modules!`, without generated-block markers. Remove only those exact lines,
 * and only while they are contiguous right after the anchor, so user-added pods elsewhere
 * are never touched.
 */
function removeLegacyFirebasePods(podfile: string): string {
  const lines = podfile.split("\n");
  const anchorIndex = lines.findIndex((line) => PODFILE_ANCHOR.test(line));
  if (anchorIndex < 0) return podfile;

  const legacyLines = new Set(FIREBASE_PODS.map(firebasePodLine));
  let end = anchorIndex + 1;
  while (end < lines.length && legacyLines.has((lines[end] ?? "").trim())) {
    end++;
  }
  if (end === anchorIndex + 1) return podfile;

  lines.splice(anchorIndex + 1, end - anchorIndex - 1);
  return lines.join("\n");
}

/**
 * Makes the Firebase pods in the Podfile match the selected notification service.
 * - always removes the Reteno-generated block (and legacy unmarked lines);
 * - re-adds the block only when `enabled` (Firebase mode).
 * Idempotent and reversible (Firebase → APNs removes the pods with `--no-clean`).
 * Throws if the Podfile has no `use_expo_modules!` anchor.
 */
export function syncFirebasePods(podfile: string, enabled: boolean): string {
  const anchorMatches = podfile
    .split("\n")
    .filter((line) => PODFILE_ANCHOR.test(line)).length;
  if (anchorMatches !== 1) {
    const error = new Error(
      `[expo-reteno-sdk] Expected exactly one \`use_expo_modules!\` line in ios/Podfile, found ${anchorMatches}. ` +
        "Cannot configure Firebase pods.",
    );
    // @ts-ignore
    error.code = "ERR_NO_MATCH";
    throw error;
  }

  let src = removeLegacyFirebasePods(podfile);
  src = removeContents({ src, tag: RetenoIOSAutogenComments.FIREBASE_PODS })
    .contents;

  if (!enabled) return src;

  // Respect pods the user declared themselves outside the generated block.
  const pods = FIREBASE_PODS.filter(
    (name) => !new RegExp(`^\\s*pod\\s+['"]${name}['"]`, "m").test(src),
  );
  if (pods.length === 0) return src;

  return mergeContents({
    src,
    newSrc: pods.map((name) => `  ${firebasePodLine(name)}`).join("\n"),
    tag: RetenoIOSAutogenComments.FIREBASE_PODS,
    anchor: PODFILE_ANCHOR,
    offset: 1,
    comment: "#",
  }).contents;
}

export async function updatePodfileFirebasePods(
  iosRoot: string,
  enabled: boolean,
) {
  const podfilePath = `${iosRoot}/Podfile`;
  const podfile = await FileService.read(podfilePath);
  const updated = syncFirebasePods(podfile, enabled);
  if (updated !== podfile) {
    await FileService.write(podfilePath, updated);
  }
}

// Function adds target to Podfile
export async function addTargetToPodfile(
  path: string,
  target: string,
  snippet: "service" | "content",
) {
  let podfile = await FileService.read(`${path}/Podfile`);

  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const targetDeclaration = new RegExp(
    `^\\s*target\\s+(['\"])${escapedTarget}\\1\\s+do(?:\\s*#.*)?$`,
    "m",
  );

  const targetMatch = targetDeclaration.exec(podfile);

  if (targetMatch) {
    const blockStart = targetMatch.index + targetMatch[0].length;
    const targetEnd = /^\s*end\s*(?:#.*)?$/m.exec(podfile.slice(blockStart));

    if (!targetEnd) {
      throw new Error(`Could not find the end of target "${target}" in Podfile`);
    }

    const blockEnd = blockStart + targetEnd.index;
    const targetBody = podfile.slice(blockStart, blockEnd);
    const retenoPod = /^[ \t]*pod\s+(['"])Reteno\1/m;
    // Drops only the version argument and keeps other pod options and comments.
    const pinnedRetenoPod =
      /^([ \t]*pod\s+(['"])Reteno\2)\s*,\s*(['"])[^'"\n]*\3([^\n]*)$/m;
    const updatedTargetBody = retenoPod.test(targetBody)
      ? targetBody.replace(pinnedRetenoPod, "$1$4")
      : targetBody.replace(/\s*$/, "\n  pod 'Reteno'\n");

    if (updatedTargetBody !== targetBody) {
      podfile =
        podfile.slice(0, blockStart) +
        updatedTargetBody +
        podfile.slice(blockEnd);
      await FileService.write(`${path}/Podfile`, podfile);
    }

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
  const sourcePath = filepathFromProps || `${sourceDir}/${source}`;
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

/**
 * node-xcode stores targets created via `addTarget` with a quoted name/comment
 * (`"NotificationServiceExtension"`), so `pbxTargetByName(name)` misses them and the
 * extension targets were duplicated on every `prebuild --no-clean`. Check both forms.
 */
function hasNativeTarget(xcodeProject: any, name: string): boolean {
  return (
    !!xcodeProject.pbxTargetByName(name) ||
    !!xcodeProject.pbxTargetByName(`"${name}"`)
  );
}

/**
 * Highest IPHONEOS_DEPLOYMENT_TARGET already present in the project (the app target,
 * e.g. 15.1 on Expo 54/55 and 16.4 on Expo 56+). Extension targets default to it so they
 * never end up below the app / pods minimum.
 */
function getAppDeploymentTarget(xcodeProject: any): string | undefined {
  const configurations = xcodeProject.pbxXCBuildConfigurationSection();
  let best: string | undefined;
  const toNumbers = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const greater = (a: string, b: string) => {
    const [x, y] = [toNumbers(a), toNumbers(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
    }
    return false;
  };
  for (const key in configurations) {
    const value = configurations[key]?.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET;
    if (typeof value !== "string" && typeof value !== "number") continue;
    const target = String(value).replace(/"/g, "");
    if (!/^\d+(\.\d+)*$/.test(target)) continue;
    if (!best || greater(target, best)) best = target;
  }
  return best;
}

export function addNotificationServiceExtensionTarget(
  config: any,
  newConfig: ExportedConfigWithProps,
  props?: RetenoIOSProps & RetenoExtensionProps,
) {
  const xcodeProject = newConfig.modResults;
  const { targetedDeviceFamily, deploymentTarget } = iosConfig;
  const appDeploymentTarget = getAppDeploymentTarget(xcodeProject);
  const { target, files, source, infoPlist } = iosConfig.nse;

  if (hasNativeTarget(xcodeProject, target)) {
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
      if (props?.devTeam) {
        buildSettings.DEVELOPMENT_TEAM = props.devTeam;
      }
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
        props?.deploymentTarget ?? appDeploymentTarget ?? deploymentTarget;
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
  if (props?.devTeam) {
    xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam, nseTarget);
    xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam);
  }

  return newConfig;
}

export function addNotificationContentExtensionTarget(
  config: any,
  newConfig: ExportedConfigWithProps,
  props?: RetenoIOSProps & RetenoExtensionProps,
) {
  const xcodeProject = newConfig.modResults;

  const { targetedDeviceFamily, deploymentTarget } = iosConfig;
  const appDeploymentTarget = getAppDeploymentTarget(xcodeProject);
  const { target, files, source, infoPlist, entitlements } = iosConfig.nce;

  // Idempotency check
  if (hasNativeTarget(xcodeProject, target)) {
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
      if (props?.devTeam) {
        buildSettings.DEVELOPMENT_TEAM = props.devTeam;
      }
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET =
        props?.deploymentTarget ?? appDeploymentTarget ?? deploymentTarget;
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
  if (props?.devTeam) {
    xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam, nceTarget);
    xcodeProject.addTargetAttribute("DevelopmentTeam", props.devTeam);
  }

  return newConfig;
}
