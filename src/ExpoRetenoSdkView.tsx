import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoRetenoSdkViewProps } from './ExpoRetenoSdk.types';

const NativeView: React.ComponentType<ExpoRetenoSdkViewProps> =
  requireNativeView('ExpoRetenoSdk');

export default function ExpoRetenoSdkView(props: ExpoRetenoSdkViewProps) {
  return <NativeView {...props} />;
}
