import { readdir } from 'fs/promises';
import { resolve } from 'path';

class DependencyInjectionAutoloader {
  public async loadAllInFolder(folder: string, ignoreFiles: string[]): Promise<void> {
    for await (const file of this.getFileList(folder)) {
      if (file !== __filename && file.endsWith('.ts') && ignoreFiles.indexOf(file) === -1) {
        await import(file);
      }
    }
  }

  private async* getFileList(folderPath: string): AsyncGenerator<string> {
    const entries = await readdir(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      const resolvedPath = resolve(folderPath, entry.name);

      if (entry.isDirectory()) {
        yield* this.getFileList(resolvedPath);
      } else {
        yield resolvedPath;
      }
    }
  }
}

export default DependencyInjectionAutoloader;
