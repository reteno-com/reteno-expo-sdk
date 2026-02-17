import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";
import {
  RetenoSubscription,
  RetenoSubscriptionEvents,
  RetenoUserAttributes,
} from "./types";

declare class ExpoRetenoSdkModule extends NativeModule {
  registerForRemoteNotifications(): string;
  setUserAttributes(userId: string, attributes?: RetenoUserAttributes): void;
  setDeviceToken(messagingToken: string): void;
}

const ModuleInstance =
  requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
const emitter = new EventEmitter<RetenoSubscriptionEvents>(ModuleInstance);

export const Reteno = {
  registerForRemoteNotifications() {
    return ModuleInstance.registerForRemoteNotifications();
  },
  setUserAttributes(userId: string, attributes = {} as RetenoUserAttributes) {
    return ModuleInstance.setUserAttributes(userId, attributes);
  },
  setDeviceToken(token: string) {
    return ModuleInstance.setDeviceToken(token);
  },
  // addPushListener: () => {
  //   return ModuleInstance.addPushListener();
  // },
  // removePushListener: () => {
  //   return ModuleInstance.removePushListener();
  // },
  addPushNotificationListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener("onPushNotificationReceived", listener);
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
