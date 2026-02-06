import * as fs from "fs";

type CreateFolderOptions = {
  recursive: boolean;
};

export class FileService {
  static async read(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (err || !data) {
          console.error("Couldn't read file:" + path);
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  static async write(path: string, contents: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, contents, "utf8", (err) => {
        if (err) {
          console.error("Couldn't write file:" + path);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  static async copy(from: string, to: string): Promise<void> {
    try {
      const content = await FileService.read(from);

      // const path = to.slice(0, to.lastIndexOf("/"));
      // const dirExists = FileService.dirExists(path);
      //
      // if (!dirExists) {
      //   throw new Error();
      // }

      await FileService.write(to, content);
    } catch (error) {
      console.error(
        "[FileService.ts] Can't copy file: directory from destination does not exist",
      );
    }
  }

  static dirExists(path: string): boolean {
    return fs.existsSync(path);
  }

  static createFolder(
    path: string,
    options?: CreateFolderOptions,
  ): string | undefined {
    return fs.mkdirSync(path, options);
  }
}
