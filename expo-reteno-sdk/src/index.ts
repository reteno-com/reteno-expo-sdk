import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";

declare class ExpoRetenoSdkModule extends NativeModule {
  initialize(key: string, withDebugMode?: boolean): string;
  setUserAttributes(userId: string): void;
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
  initialize(accessToken: string, withDebugMode = false) {
    return ModuleInstance.initialize(accessToken, withDebugMode);
  },
  setUserAttributes(userId: string) {
    return ModuleInstance.setUserAttributes(userId);
  },
  addPushNotificationListener(
    listener: (event: any) => void,
  ): RetenoSubscription {
    return emitter.addListener("onPushNotificationReceived", listener);
  },
};

// This call loads the native module object from the JSI.
export default Reteno;
