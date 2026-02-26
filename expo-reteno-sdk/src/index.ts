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
  User,
  UserAttributes,
  UserInformationPayload,
} from "./types";
// import { Platform } from "react-native";

declare class ExpoRetenoSdkModule extends NativeModule {
  registerForRemoteNotifications(): string;
  setDeviceToken(messagingToken: string): void;
  updateUserAttributes(payload: UserInformationPayload): void;
  updateAnonymousUserAttributes(attributes?: AnonymousUserAttributes): void;
  updateMultiAccountUserAttributes(
    payload: UserInformationPayload,
    accountSuffix: string,
  ): void;
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
  updateUserAttributes(userId: string, attributes = {} as User) {
    return ModuleInstance.updateUserAttributes({
      externalUserId: userId,
      user: attributes,
    });
  },
  updateAnonymousUserAttributes(attributes: AnonymousUserAttributes) {
    return ModuleInstance.updateAnonymousUserAttributes(attributes);
  },
  updateMultiAccountUserAttributes(
    userId: string,
    attributes = {} as User,
    accountSuffix = "",
  ) {
    return ModuleInstance.updateMultiAccountUserAttributes(
      {
        externalUserId: userId,
        user: attributes,
      },
      accountSuffix,
    );
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
    return ModuleInstance.forcePushData();
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
