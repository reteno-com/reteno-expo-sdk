import * as path from "path";
import { FileService } from "./FileService";

export async function copyGoogleServiceFile(
  config: any,
  gsPath: string,
  destination: string,
) {
  const rootDir = config.modRequest.projectRoot;

  const from = path.join(rootDir, gsPath);
  const to =
    config.modRequest.platformProjectRoot + destination.replace("./", "");

  await FileService.copy(from, to);

  return true;
}
