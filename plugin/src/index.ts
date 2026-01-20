import { ConfigPlugin} from "expo/config-plugins";
import { withRetenoIOS, RetenoIOS } from "./withRetenoIOS";

type RetenoProps = {
  ios: RetenoIOS;
};

const withRetenoInstall: ConfigPlugin<RetenoProps> = (config, props) => {
  if (!props) {
    throw new Error(
      "⛔️ You are trying to setup RetenoSDK without any props which are required for valid plugin configuration. Please, see docs: <doc_link>",
    );
  }

  // TODO: Add possibility to install SDK only for one platform
  const cfg = withRetenoIOS(config, props.ios);

  return cfg;
};

export default withRetenoInstall;
