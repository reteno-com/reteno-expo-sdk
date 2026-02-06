import {
  EventEmitter,
  NativeModule,
  requireNativeModule,
} from "expo-modules-core";

declare class ExpoRetenoSdkModule extends NativeModule {
  initialize(key: string): string;
  setUserAttributes(userId: string): void;
}

export type ExpoSubscription = {
  remove: () => void;
};

const ExpoRetenoSdk = requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");

const emitter = new EventEmitter(ExpoRetenoSdk);

export function addPushNotificationListener(
  listener: (event: any) => void,
): ExpoSubscription {
  // @ts-ignore
  return emitter.addListener("onPushNotificationReceived", listener);
}

// This call loads the native module object from the JSI.
export default ExpoRetenoSdk;
