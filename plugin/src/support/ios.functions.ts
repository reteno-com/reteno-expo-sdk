import { iosConfig } from "./constants";

// // NOTE: iOS-only
// export async function updatePodfile(path: string) {
//   const podfile = await FileService.read(`${path}/Podfile`);
//   const didMatch = podfile.match();
//
//   if (didMatch) {
//     console.warn(
//       "⚠️ NotificationServiceExtension: target already added to Podfile. Skipping...",
//     );
//   } else {
//     let content = podfile.replace(
//       "use_expo_modules!",
//       'use_expo_modules!\n\tuse_frameworks!\n\tpod "Reteno"',
//     );
//
//     content += IOS_NSE_PODFILE_SNIPPET;
//
//     fs.writeFile(`${path}/Podfile`, content, (err) => {
//       if (err) {
//         console.error(
//           "⛔️ NotificationServiceExtension: Error writing to Podfile",
//         );
//       }
//     });
//   }
// }
//
// // NOTE: iOS-only
// export async function createServiceExtensionFiles(
//   files: string[],
//   path: string,
//   sourceDir: string,
// ) {
//   for (let i = 0; i < files.length; i++) {
//     const extFile = files[i];
//     const targetFile = `${path}/${extFile}`;
//
//     await FileService.copy(`${sourceDir}${extFile}`, targetFile);
//   }
// }
//
// // NOTE: iOS-only
// export async function updateServiceExtensionEntitlements(
//   path: string,
//   groupIdentifier: string,
// ): Promise<void> {
//   const entitlementsFilePath = `${path}/${iosConfig.entitlements}`;
//   let entitlementsFile = await FileService.read(entitlementsFilePath);
//
//   entitlementsFile = entitlementsFile.replace(
//     /{{GROUP_IDENTIFIER}}/gm,
//     groupIdentifier,
//   );
//
//   await FileService.write(entitlementsFilePath, entitlementsFile);
// }
//
// // export function getPBXSection(project: any, key: string, debug = false) {
// //   const objects = Object.assign({}, project.hash.project.objects);
// //
// //   if (debug) {
// //     // console.log("[key]", key, Object.keys(objects));
// //
// //     if (objects[key]) {
// //       // console.log("match:", key, Object.assign({}, objects[key]));
// //       return Object.assign({}, objects[key]);
// //     } else return {};
// //   }
// //
// //   if (objects[key]) {
// //     // console.log("match:", key, Object.assign({}, objects[key]));
// //     return Object.assign({}, objects[key]);
// //   }
// //
// //   // return objects[key] ? Object.assign({}, objects[key]) : {};
// //   return {};
// // }
//
// /**
//  * iOS-only
//  */
// // export function getApplicationTarget(project: any) {
// //   const targets = project.pbxNativeTargetSection();
// //
// //   const entry = Object.entries(targets).find(([, target]: any) => {
// //     const t = Object.assign({}, target);
// //     return t.productType === '"com.apple.product-type.application"';
// //   }) as any[];
// //
// //   if (!entry) {
// //     throw new Error(`Application Target not found`);
// //   }
// //
// //   return { id: entry[0], target: entry[1] };
// // }
//
// /**
//  * iOS-only
//  */
// // export function findTargetByKey(project: any, key: string) {
// //   const targets = project.pbxNativeTargetSection();
// //
// //   const entry = Object.entries(targets).find(([, target]: any) => {
// //     return target.name === key;
// //   }) as any[];
// //
// //   if (!entry) {
// //     throw new Error(`Target "${key}" not found`);
// //   }
// //
// //   return { id: entry[0], target: entry[1] };
// // }
//
// /**
//  * iOS-only
//  */
// // export function getBuildConfigsForTarget(project: any, target: any) {
// //   const configLists = getPBXSection(project, "XCConfigurationList", true);
// //   const buildConfigs = getPBXSection(project, "XCBuildConfiguration");
// //
// //   // console.log("[configLists]", configLists, target);
// //
// //   const list = configLists[target.buildConfigurationList];
// //   if (!list) {
// //     throw new Error("Build configuration list not found");
// //   }
// //
// //   return list.buildConfigurations
// //     .map((cfg: any) => buildConfigs[cfg.value])
// //     .filter(Boolean);
// // }
//
// /**
//  * iOS-only
//  */
// // export function ensureEmbedAppExtensionsPhase(
// //   project: any,
// //   appTargetId: string,
// // ) {
// //   const copyFiles = getPBXSection(project, "PBXCopyFilesBuildPhase");
// //
// //   const existing = Object.values(copyFiles).find(
// //     (phase: any) =>
// //       phase.name === "Embed App Extensions" && phase.dstSubfolderSpec === "13", // plugins
// //   );
// //
// //   if (existing) {
// //     return existing;
// //   }
// //
// //   const uuid = project.generateUuid();
// //
// //   copyFiles[uuid] = {
// //     isa: "PBXCopyFilesBuildPhase",
// //     buildActionMask: "2147483647",
// //     dstPath: "",
// //     dstSubfolderSpec: 13,
// //     files: [],
// //     name: "Embed App Extensions",
// //     runOnlyForDeploymentPostprocessing: 0,
// //   };
// //
// //   // Attach phase to app target
// //   const nativeTargets = getPBXSection(project, "PBXNativeTarget");
// //   nativeTargets[appTargetId].buildPhases.push({
// //     value: uuid,
// //     comment: "Embed App Extensions",
// //   });
// //
// //   return uuid;
// // }
//
// // function updateEmbedExtensionsPhase(project: any, appTargetUuid: string) {
// //   const target = project.pbxNativeTargetSection()[appTargetUuid];
// //   const buildPhases = target.buildPhases || [];
// //
// //   for (const phase of buildPhases) {
// //     const phaseObj =
// //       project.hash.project.objects.PBXCopyFilesBuildPhase[phase.value];
// //     if (
// //       phaseObj &&
// //       phaseObj.dstSubfolderSpec === 13 &&
// //       phaseObj.name === '"Embed App Extensions"'
// //     ) {
// //       console.log("foo", phase);
// //       return phase.value;
// //     }
// //   }
// //
// //   const ePhase = project.addBuildPhase(
// //     [],
// //     "PBXCopyFilesBuildPhase",
// //     "Embed App Extensions",
// //     appTargetUuid,
// //     "app_extension",
// //   );
// //
// //   return ePhase;
// // }
// //
// // export function embedExtension(
// //   project: any,
// //   appTargetId: string,
// //   nseProductRef: string,
// // ) {
// //   // const buildFiles = getPBXSection(project, "PBXBuildFile");
// //   //
// //   const phase = updateEmbedExtensionsPhase(project, appTargetId);
// //
// //   if (!nseProductRef) {
// //     throw new Error("Extension target has no productReference");
// //   }
// //
// //   // project.addBuildFile(nseProductRef, embedId, { weak: false });
// //   project.addToPbxCopyFilesGroup(nseProductRef, phase);
// //
// //   // project.hash.project.objects.PBXBuildFile[buildId] = {
// //   //   isa: "PBXBuildFile",
// //   //   fileRef: nseTarget.productReference,
// //   //   settings: {
// //   //     ATTRIBUTES: ["RemoveHeadersOnCopy"],
// //   //   },
// //   // };
// //   //
// //   // project.hash.project.objects.PBXCopyFilesBuildPhase[embedId].files.push({
// //   //   value: buildId,
// //   //   comment: "NotificationServiceExtension.appex",
// //   // });
// // }

/*
 * Generates iOS PBX-like UUID
 * @note: iOS-only
 */
export function generateUuid() {
  return (
    Math.random().toString(16).slice(2, 10).toUpperCase() +
    Math.random().toString(16).slice(2, 6).toUpperCase()
  );
}

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
                    `group.${config?.ios?.bundleIdentifier}.reteno`,
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
