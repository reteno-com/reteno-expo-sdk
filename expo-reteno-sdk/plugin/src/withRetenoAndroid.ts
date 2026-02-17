import {
  ConfigPlugin,
  withAppBuildGradle,
  withGradleProperties,
  withMainApplication,
  withProjectBuildGradle,
} from "expo/config-plugins";
import {
  addCompileOptions,
  addModuleGradleDependencies,
  addGradleProperties,
  addProjectGradleDependencies,
  addSdkAndFirebaseImports,
  initializeSdk,
} from "./support/android.functions";
import { RetenoAndroidProps } from "./types";

const withProjectGradleDependencies: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (cfg: any) => {
    if (cfg.modResults.language === "groovy") {
      cfg.modResults.contents = addProjectGradleDependencies(
        cfg.modResults.contents,
      );
    } else {
      console.warn(
        "[android.googleServicesFile] Cannot automatically configure project build.gradle if it's not groovy",
      );
    }

    return cfg;
  });
};

const withModuleGradleDependencies: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (cfg: any) => {
    if (cfg.modResults.language === "groovy") {
      cfg.modResults.contents = addModuleGradleDependencies(
        cfg.modResults.contents,
      );
    } else {
      console.warn(
        "[android.googleServicesFile] Cannot automatically configure app build.gradle if it's not groovy",
      );
    }

    return cfg;
  });
};

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

const withAppMainActivity: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  return withMainApplication(config, (config) => {
    config.modResults.contents = addSdkAndFirebaseImports(
      config.modResults.contents,
      config.modResults.language,
    );
    config.modResults.contents = initializeSdk(
      config.modResults.contents,
      props,
    );

    return config;
  });
};

export const withRetenoAndroid: ConfigPlugin<RetenoAndroidProps> = (
  config,
  props,
) => {
  // config = withCopyGoogleServiceFile(config, props);
  config = withProjectGradleDependencies(config);
  config = withModuleGradleDependencies(config);
  config = withAppGradleProperties(config);
  config = withAppCompileOptions(config);
  config = withAppMainActivity(config, props);

  return config;
};
