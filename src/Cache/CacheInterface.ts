interface CacheInterface {
  /**
   * @param {string} key
   * @param {string} value
   * @param {number|undefined} ttl Time-to-live. The milliseconds until this cache item should be deleted. If not
   *                               passed or 0, the item will be cached forever.
   */
  set(key: string, value: unknown, ttl?: number): Promise<void>;

  get(key: string): Promise<unknown | null>;
}

export default CacheInterface;
