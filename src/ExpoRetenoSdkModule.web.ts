import { registerWebModule, NativeModule } from 'expo';

import { ExpoRetenoSdkModuleEvents } from './ExpoRetenoSdk.types';

class ExpoRetenoSdkModule extends NativeModule<ExpoRetenoSdkModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoRetenoSdkModule, 'ExpoRetenoSdkModule');
