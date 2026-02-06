import { androidConfig } from "./constants";
import * as path from "path";
import { FileService } from "./FileService";

/*
 * Add dependencies to application's Gradle
 * @see: https://docs.reteno.com/reference/react-native-android-sdk#getting-started-with-reteno-sdk-for-android
 */
export function addProjectGradleDependencies(content: string) {
  const didExist = content.indexOf(androidConfig.sdk.project.deps[0]) > -1;

  if (didExist) return content;

  const { anchor, deps } = androidConfig.sdk.project;

  let updated = content.replace(
    anchor,
    `${anchor}
    // Reteno SDK dependencies
    ${deps.join("\n  ")}`,
  );

  return updated;
}

/*
 * Add dependencies to application's Gradle
 * @see: https://docs.reteno.com/reference/react-native-android-sdk#getting-started-with-reteno-sdk-for-android
 */
export function addModuleGradleDependencies(content: string) {
  const didExist = content.indexOf(androidConfig.sdk.module.deps[0]) > -1;

  if (didExist) return content;

  const { anchor, deps } = androidConfig.sdk.module;

  let updated = content.replace(
    anchor,
    `${anchor}
    \n\t// Reteno SDK dependencies
    ${deps.join("\n  ")}`,
  );

  updated = updated.concat("apply plugin: 'com.google.gms.google-services'");

  return updated;
}

/*
 * Set `useAndroidX` and `enableJetifier`
 * @see: https://docs.reteno.com/reference/react-native-android-sdk#getting-started-with-reteno-sdk-for-android
 */
export function addGradleProperties(props: any) {
  const setProperty = (key: string, value: string) => {
    const existingProperty = props.find((p: { key: string }) => p.key === key);

    if (existingProperty) {
      existingProperty.value = value;
    } else {
      props.push({ type: "property", key, value });
    }
  };

  for (const prop in androidConfig.sdk.properties) {
    // @ts-ignore
    const value = androidConfig.sdk.properties[prop];
    setProperty(prop, value);
  }

  return props;
}

/*
 * Add `sourceCompatibility` or `targetCompatibility` to application's Gradle
 * @see: https://docs.reteno.com/reference/react-native-android-sdk#getting-started-with-reteno-sdk-for-android
 */
export function addCompileOptions(content: string) {
  // const androidRegex = /android\s?{(.*?)}\W"/s;

  const findMatches = (
    needle: "sourceCompatibility" | "targetCompatibility" | "defaultConfig",
  ) => {
    const pattern = "android\\s?{(.*?)" + needle;
    const regex = new RegExp(pattern, "s");

    return content.match(regex);
  };

  const sourceCompatibilityMatches = findMatches("sourceCompatibility");
  const targetCompatibilityMatches = findMatches("targetCompatibility");

  /**
   * If Android project was ejected,
   * we should check previously set `sourceCompatibility` and `targetCompatibility`
   *
   * If it was set before, we skip updates
   */
  if (sourceCompatibilityMatches || targetCompatibilityMatches) {
    return content;
  }

  // Next we should update Gradle script
  const { gradleSourceAndTarget } = androidConfig.sdk;
  const updatesStringified = gradleSourceAndTarget.join("\n\t\t");

  const matches = findMatches("defaultConfig")!;
  const [android] = matches;

  const idx = android.indexOf("compileOptions");

  // App already has `compileOptions`, so we need to add new options to it
  if (idx > -1) {
    return android.replace(
      "compileOptions {",
      "compileOptions {\n" + updatesStringified,
    );
  }

  const beforeDefaultConfig = android.slice(
    0,
    android.indexOf("defaultConfig"),
  );

  return content.replace(
    android,
    `
    ${beforeDefaultConfig}
    compileOptions {
    \t${updatesStringified}
    }

    defaultConfig`,
  );
}

export async function copyGoogleServiceFile(config: any, gsPath: string) {
  const rootDir = config.modRequest.projectRoot;

  const from = path.join(rootDir, gsPath);
  const to = config.modRequest.platformProjectRoot;

  await FileService.copy(from, to + "/app/google-services.json");

  return true;
}
