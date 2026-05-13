const {
  withAppBuildGradle,
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ANDROID_VERSION = process.env.ANDROID_VERSION || "1.0.2";

function withAndroidVersion(config, version) {
  return withAppBuildGradle(config, (c) => {
    c.modResults.contents = c.modResults.contents.replace(
      /versionName\s+"[\d.]+"/,
      `versionName "${version}"`
    );
    return c;
  });
}

const NETWORK_SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`;

function withReleaseBuildDebuggable(config) {
  return withAppBuildGradle(config, (c) => {
    c.modResults.contents = c.modResults.contents.replace(
      /(release\s*\{)/,
      "$1\n            debuggable true"
    );
    return c;
  });
}

function withNetworkSecurityConfig(config) {
  config = withDangerousMod(config, [
    "android",
    (c) => {
      const xmlDir = path.join(
        c.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, "network_security_config.xml"),
        NETWORK_SECURITY_CONFIG_XML
      );
      return c;
    },
  ]);

  config = withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return c;
  });

  return config;
}

module.exports = ({ config }) => {
  config = withAndroidVersion(config, ANDROID_VERSION);
  config = withReleaseBuildDebuggable(config);
  config = withNetworkSecurityConfig(config);
  return config;
};
