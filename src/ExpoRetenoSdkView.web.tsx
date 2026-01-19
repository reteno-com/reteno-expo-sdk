import * as React from 'react';

import { ExpoRetenoSdkViewProps } from './ExpoRetenoSdk.types';

export default function ExpoRetenoSdkView(props: ExpoRetenoSdkViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
