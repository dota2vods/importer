import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { singleton } from 'tsyringe';
import mkdirp from 'mkdirp';
import CacheInterface from './CacheInterface';

@singleton()
class FileSystemCache implements CacheInterface {
  public async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const filePath = this.getFilePathForKey(key);
    const keepUntil = ttl && ttl > 0 ? Date.now() + ttl : 0;

    // Make sure the cache folder exists
    await mkdirp(dirname(filePath));

    return writeFile(filePath, `${keepUntil}|${JSON.stringify(value)}`);
  }

  public async get(key: string): Promise<unknown | null> {
    const filePath = this.getFilePathForKey(key);

    try {
      const fileContents = (await readFile(filePath)).toString();

      const splitPosition = fileContents.indexOf('|');
      const keepUntil = parseInt(fileContents.substring(0, splitPosition), 10);
      const stringifiedContents = fileContents.substring(splitPosition + 1);

      if (keepUntil > 0 && Date.now() > keepUntil) {
        // Max cache time reached, ignore the cache file and return null
        // We don't need to delete the file as it will probably be re-written by the calling code in the next step
        // anyway.

        return null;
      }

      // Return the cached contents
      return JSON.parse(stringifiedContents);
    } catch {
      // Cache item does not exist or is not accessible, return null
      return null;
    }
  }

  private getFilePathForKey(key: string): string {
    const hashedKey = createHash('sha1').update(key).digest('hex');

    return join(__dirname, '..', '..', 'var', 'cache', hashedKey.substring(0, 3), hashedKey);
  }
}

export default FileSystemCache;
