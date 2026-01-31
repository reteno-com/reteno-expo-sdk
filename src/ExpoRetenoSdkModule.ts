import { NativeModule, requireNativeModule } from "expo";

declare class ExpoRetenoSdkModule extends NativeModule {
  start(key: string): string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRetenoSdkModule>("ExpoRetenoSdk");
