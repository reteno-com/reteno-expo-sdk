import { NativeModule, requireNativeModule } from 'expo';

import { ExpoRetenoSdkModuleEvents } from './ExpoRetenoSdk.types';

declare class ExpoRetenoSdkModule extends NativeModule<ExpoRetenoSdkModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRetenoSdkModule>('ExpoRetenoSdk');
