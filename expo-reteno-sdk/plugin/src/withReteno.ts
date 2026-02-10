import { ConfigPlugin } from "expo/config-plugins";
import { withRetenoIOS, RetenoIOS } from "./withRetenoIOS";
import { RetenoAndroidProps, withRetenoAndroid } from "./withRetenoAndroid";

type RetenoProps = {
  ios: RetenoIOS;
  android: RetenoAndroidProps;
};

const withReteno: ConfigPlugin<RetenoProps> = (config, props) => {
  if (!props) {
    throw new Error(
      "⛔️ You are trying to setup RetenoSDK without any props which are required for valid plugin configuration. Please, see docs: <doc_link>",
    );
  }

  // TODO: Add possibility to install SDK only for one platform
  config = withRetenoAndroid(config, props.android);
  config = withRetenoIOS(config, props.ios);

  return config;
};

export default withReteno;
