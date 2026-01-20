import { NativeModule, requireNativeModule } from "expo";

declare class ExpoRetenoSdkModule extends NativeModule {
  start(key: string): string;
  requestPermissions(): Promise<void>;
  processRemoteNotificationsToken(token: string): void;
  processRemoteNotificationsTokenByFCM(token: string): void;
  processRemoteNotificationsTokenByDeviceId(token: string): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
