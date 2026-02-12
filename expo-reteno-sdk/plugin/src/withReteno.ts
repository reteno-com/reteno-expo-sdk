import { ConfigPlugin } from "expo/config-plugins";
import { withRetenoIOS } from "./withRetenoIOS";
import { withRetenoAndroid } from "./withRetenoAndroid";
import { RetenoProps } from "./types";

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
