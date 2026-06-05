export type MergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};

export type RetenoIOSProps = {
  /**
   * SDK access key for zero-config auto-init (Path A).
   * When set, the plugin writes the key to Info.plist and the native module
   * initializes the SDK automatically with default options — no JS `initialize()` needed.
   * **If set, any subsequent `Reteno.initialize()` call is a no-op: runtime options
   * (isDebugMode, lifecycleTrackingOptions, etc.) will not be applied.**
   * Omit to use Path B: call `Reteno.initialize({ apiKey })` from JS for full option control.
   */
  sdkAccessToken?: string;
  notificationService?: "firebase" | "apns";
  devTeam: string;
  appGroups: string[];
  config: RetenoInitConfig;
};

export type RetenoExtensionProps = {
  mode: "development" | "production";
  nseFilepath: string;
  nceFilepath: string;
  deploymentTarget?: string;
};

export type RetenoExtensionTarget = RetenoIOSProps & RetenoExtensionProps;

export type RetenoAndroidProps = {
  /**
   * SDK access key for zero-config auto-init (Path A).
   * When set, the plugin writes the key to AndroidManifest meta-data and the native
   * module initializes the SDK automatically with default options — no JS `initialize()` needed.
   * **If set, any subsequent `Reteno.initialize()` call is a no-op: runtime options
   * (isDebugMode, lifecycleTrackingOptions, etc.) will not be applied.**
   * Omit to use Path B: call `Reteno.initialize({ apiKey })` from JS for full option control.
   */
  sdkAccessToken?: string;
  config: RetenoInitConfig;
};

export type RetenoProps = {
  ios: RetenoIOSProps;
  android: RetenoAndroidProps;
  config: RetenoInitConfig;
};

export const RetenoIOSAutogenComments = {
  RETENO_IMPORT: "expo-reteno-sdk - import",
  RETENO_INIT: "expo-reteno-sdk - init",
  FIREBASE_MESSAGING_DELEGATE: "@react-native-firebase/app - MessagingDelegate",
  FIREBASE_INIT: "@react-native-firebase/app - init",
  FIREBASE_IMPORT: "@react-native-firebase/app - import",
  RETENO_APNS: "expo-reteno-sdk - APNs",
} as const;

export type RetenoInitConfigKeys =
  | "isDebugMode"
  | "isAutomaticSessionReportingEnabled"
  | "isAutomaticPushSubsriptionReportingEnabled"
  | "isPausedInAppMessages";

export type RetenoInitConfig = Partial<{
  [key in RetenoInitConfigKeys]: boolean;
}>;
