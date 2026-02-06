export const iosConfig = {
  nse: {
    files: [
      "NotificationService.swift",
      "NotificationServiceExtension-Info.plist",
      "NotificationServiceExtension.entitlements",
    ],
    source: "NotificationService.swift",
    target: "NotificationServiceExtension",
    entitlements: "NotificationServiceExtension.entitlements",
  },
  targetedDeviceFamily: `"1,2"`,
  deploymentTarget: "15.1",
};

export const IOS_NSE_PODFILE_SNIPPET = `
target '${iosConfig.nse.target}' do
\tuse_frameworks!
\tpod 'Reteno', '2.5.14'
end`;

export const androidConfig = {
  sdk: {
    project: {
      anchor: "dependencies {",
      deps: ["classpath 'com.google.gms:google-services:4.3.2'"],
    },
    module: {
      anchor: 'implementation("com.facebook.react:react-android")',
      deps: [
        // "implementation 'com.google.firebase:firebase-core:9.6.1'",
        "implementation 'com.reteno:fcm:2.8.9'",
        "implementation 'com.google.firebase:firebase-messaging:23.1.0'",
        "implementation 'com.google.firebase:firebase-messaging-ktx:23.1.0'",
      ],
    },
    properties: {
      "android.useAndroidX": true,
      "android.enableJetifier": true,
    },
    gradleSourceAndTarget: [
      "sourceCompatibility JavaVersion.VERSION_1_8",
      "targetCompatibility JavaVersion.VERSION_1_8",
    ],
  },
};
