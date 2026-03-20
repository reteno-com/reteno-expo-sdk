export type MergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};

export type RetenoIOSProps = {
  sdkAccessToken: string;
  notificationService: "firebase" | "apns";
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
  sdkAccessToken: string;
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
