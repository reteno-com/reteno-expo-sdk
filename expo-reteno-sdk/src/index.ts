import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";
import {
  AnonymousUserAttributes,
  LogEventPayload,
  LogScreenViewPayload,
  RetenoSubscription,
  RetenoSubscriptionEvents,
  UserAttributes,
} from "./types";
// import { Platform } from "react-native";

declare class ExpoRetenoSdkModule extends NativeModule {
  registerForRemoteNotifications(): string;
  setDeviceToken(messagingToken: string): void;
  updateUserAttributes(payload: {
    externalUserId: string;
    userAttributes?: UserAttributes;
  }): void;
  updateAnonymousUserAttributes(attributes?: AnonymousUserAttributes): void;
  logEvent(payload: LogEventPayload): Promise<boolean | string>;
  logScreenView(payload: LogScreenViewPayload): Promise<boolean | string>;
  forcePushData(): Promise<void>;
}

const ModuleInstance =
  requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
const emitter = new EventEmitter<RetenoSubscriptionEvents>(ModuleInstance);

export const Reteno = {
  registerForRemoteNotifications() {
    return ModuleInstance.registerForRemoteNotifications();
  },
  setDeviceToken(token: string) {
    return ModuleInstance.setDeviceToken(token);
  },
  updateUserAttributes(userId: string, attributes = {} as UserAttributes) {
    return ModuleInstance.updateUserAttributes({
      externalUserId: userId,
      userAttributes: attributes,
    });
  },
  updateAnonymousUserAttributes(attributes: AnonymousUserAttributes) {
    return ModuleInstance.updateAnonymousUserAttributes(attributes);
  },
  addPushNotificationListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener("onPushNotificationReceived", listener);
  },
  logEvent(payload: LogEventPayload): Promise<boolean | string> {
    return ModuleInstance.logEvent(payload);
  },
  logScreenView(screenName: LogScreenViewPayload): Promise<boolean | string> {
    return ModuleInstance.logScreenView(screenName);
  },
  forcePushData(): Promise<void> {
    // if (Platform.OS === "ios") {
    //   return ModuleInstance.forcePushData();
    // }

    return ModuleInstance.forcePushData();
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
