const SDK_VERSION = "2.6.1";

export const iosConfig = {
  nse: {
    files: [
      "Info.plist",
      "NotificationServiceExtension-Info.plist",
      "NotificationServiceExtension.entitlements",
    ],
    source: "NotificationService.swift",
    target: "NotificationServiceExtension",
    entitlements: "NotificationServiceExtension.entitlements",
    infoPlist: "Info.plist",
  },
  nce: {
    files: [
      "Info.plist",
      "NotificationContentExtension-Info.plist",
      "NotificationContentExtension.entitlements",
    ],
    source: "NotificationViewController.swift",
    target: "NotificationContentExtension",
    entitlements: "NotificationContentExtension.entitlements",
    infoPlist: "Info.plist",
  },
  targetedDeviceFamily: `"1,2"`,
  deploymentTarget: "15.1",
  snippets: {
    messaging: {
      firebase: {
        extension: [
          "extension AppDelegate: MessagingDelegate {",
          "\tpublic func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {",
          '\t\tprint("[DEBUG] Successfully registered for Push Notifications")',
          "\t\tguard let fcmToken = fcmToken else { return }",
          "\t\tReteno.userNotificationService.processRemoteNotificationsToken(fcmToken)",
          "\t}",
          "}",
        ],
        application: [
          "\tpublic override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {",
          '\t\tlet tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()',
          "\t\tMessaging.messaging().setAPNSToken(deviceToken, type: .unknown)",
          "\t}",
        ],
      },
      apns: [
        "\tpublic override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {",
        '\t\tprint("[APNS] Successfully registered for Push Notifications")',
        '\t\tlet tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()',
        "\t\tReteno.userNotificationService.processRemoteNotificationsToken(tokenString)",
        "\t}",
      ],
    },
    nse: `
target 'NotificationServiceExtension' do
use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  pod 'Reteno', '${SDK_VERSION}'
end
      `,

    nce: `
target 'NotificationContentExtension' do
use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  pod 'Reteno', '${SDK_VERSION}'
  end
  `,
  },
  defaultBundleVersions: {
    shortVersion: "1.0.0",
    version: "1",
  },
};

export const androidConfig = {
  sdk: {
    project: {
      anchor: "dependencies {",
      deps: ["classpath 'com.google.gms:google-services:4.4.4'"],
    },
    module: {
      anchor: 'implementation("com.facebook.react:react-android")',
      deps: [
        "implementation 'com.reteno:core:2.9.1'",
        "implementation 'com.reteno:push:2.9.1'",
        "implementation 'com.reteno:fcm:2.9.1'",
        "implementation 'com.google.firebase:firebase-messaging:23.1.0'",
        "implementation 'com.google.firebase:firebase-messaging-ktx:23.1.0'",
      ],
    },
    properties: {
      "android.useAndroidX": true,
      // "android.enableJetifier": true,
    },
    gradleSourceAndTarget: [
      "sourceCompatibility JavaVersion.VERSION_1_8",
      "targetCompatibility JavaVersion.VERSION_1_8",
    ],
  },
};
