import { ConfigPlugin, withInfoPlist, withEntitlementsPlist } from "expo/config-plugins";

export type RetenoIOS = {
  appGroups: string[];
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

    console.log(">>", cfg?.ios?.bundleIdentifier);

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
}

export const withRetenoIOS: ConfigPlugin<RetenoIOS> = (config, props) => {
  config = withRemoteNotificationsPermissions(config);
  config = withAppGroups(config, props.appGroups);

  return config;
};
