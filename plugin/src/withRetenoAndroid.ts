import {
  ConfigPlugin,
  withAppBuildGradle,
  withGradleProperties,
} from "expo/config-plugins";
import {
  addCompileOptions,
  addGradleDependencies,
  addGradleProperties,
} from "./support/android.functions";

type RetenoAndroidProps = {};

// const withAppGradleDependencies: ConfigPlugin = (config) => {
//   return withAppBuildGradle(config, (cfg: any) => {
//     if (cfg.modResults.language === "groovy") {
//       cfg.modResults.contents = addGradleDependencies(cfg.modResults.contents);
//     } else {
//       console.warn(
//         "[android.googleServicesFile] Cannot automatically configure app build.gradle if it's not groovy",
//       );
//     }
//
//     return cfg;
//   });
// };

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

export const withRetenoAndroid: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props = {},
) => {
  // config = withAppGradleDependencies(config);
  config = withAppGradleProperties(config);
  config = withAppCompileOptions(config);

  return config;
};
