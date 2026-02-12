import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";

declare class ExpoRetenoSdkModule extends NativeModule {
  registerForRemoteNotifications(): string;
  setUserAttributes(userId: string): void;
  setDeviceToken(messagingToken: string): void;
}

type RetenoSubscription = {
  remove: () => void;
};

type RetenoSubscriptionEvents = {
  onPushNotificationReceived: (event: {
    body: string;
    [key: string]: any;
  }) => void;
};

const ModuleInstance =
  requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
const emitter = new EventEmitter<RetenoSubscriptionEvents>(ModuleInstance);

export const Reteno = {
  registerForRemoteNotifications() {
    return ModuleInstance.registerForRemoteNotifications();
  },
  setUserAttributes(userId: string) {
    return ModuleInstance.setUserAttributes(userId);
  },
  setDeviceToken(token: string) {
    return ModuleInstance.setDeviceToken(token);
  },
  addPushNotificationListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener("onPushNotificationReceived", listener);
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
