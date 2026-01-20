import ExpoRetenoSdkModule from "./ExpoRetenoSdkModule";

class ExpoReteno {
  constructor() {}

  start(key: string) {
    ExpoRetenoSdkModule.start(key);
  }

  requestPermissions() {
    ExpoRetenoSdkModule.requestPermission();
  }
}

const Reteno = new ExpoReteno();

export default Reteno;
