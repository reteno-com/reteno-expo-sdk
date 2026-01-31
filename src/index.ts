import ExpoRetenoSdkModule from "./ExpoRetenoSdkModule";

class ExpoReteno {
  constructor() {}

  start(key: string) {
    console.log("key", key);
    ExpoRetenoSdkModule.start(key);
  }
}

const Reteno = new ExpoReteno();

export default Reteno;
