export type MergeResults = {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
};

export type RetenoIOSProps = {
  sdkAccessToken: string;
  debug: boolean;
  notificationService: "firebase" | "apns";
  devTeam: string;
  appGroups: string[];
  mode: "development" | "production";
};

export type RetenoAndroidProps = {};

export type RetenoProps = {
  ios: RetenoIOSProps;
  android: RetenoAndroidProps;
};

export const RetenoIOSAutogenComments = {
  RETENO_IMPORT: "expo-reteno-sdk - import",
  RETENO_INIT: "expo-reteno-sdk - init",
  MESSAGING_DELEGATE: "@react-native-firebase/app - MessagingDelegate",
  FIREBASE_INIT: "@react-native-firebase/app - init",
  FIREBASE_IMPORT: "@react-native-firebase/app - import",
} as const;
