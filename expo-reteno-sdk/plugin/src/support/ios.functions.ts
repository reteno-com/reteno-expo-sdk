import { MergeResults, RetenoIOSAutogenComments } from "../types";
import { iosConfig } from "./constants";
import crypto from "crypto";
import { FileService } from "./FileService";

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
  config: { apiKey: string; isDebugMode?: boolean },
): MergeResults {
  const newSrc = [
    `\tReteno.start(apiKey: "${config.apiKey}", isDebugMode: ${config.isDebugMode ?? false})`,
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
export async function updatePodfile(
  path: string,
  pods: Record<"name" | "addon", string>[],
  anchor: string,
) {
  const podfile = await FileService.read(`${path}/Podfile`);

  if (podfile.indexOf(anchor) < 0) {
    throw new Error("Anchor was not found");
  }

  const updates = [];

  for (const p of pods) {
    // TODO: Check if commented
    if (podfile.indexOf(`pod '${p.name}'`) > -1) {
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
