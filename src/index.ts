import ExpoRetenoSdkModule from "./ExpoRetenoSdkModule";

class ExpoReteno {
  constructor() {}

  initialize(key: string) {
    ExpoRetenoSdkModule.initialize(key);
  }

  setUserAttributes(userId: string) {
    ExpoRetenoSdkModule.setUserAttributes(userId);
  }
}

const Reteno = new ExpoReteno();

export default Reteno;
