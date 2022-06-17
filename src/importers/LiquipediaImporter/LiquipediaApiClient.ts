import realFetch, { Response } from 'node-fetch';
import querystring from 'querystring';
import sleep from 'sleep-promise';
import ImportError from '../../ImportError';
import CacheInterface from '../../cache/CacheInterface';
import { UpdateStatus } from '../../types/ImporterInterface';

enum Action {
  query = 'query',
}

interface QueryParameters {
  action: Action;
  [key: string]: string | number;
}

interface CategoryMember {
  title: string;
}

interface CategoryMembersResponse {
  continue?: {
    cmcontinue: string;
    continue: string;
  }
  query: {
    categorymembers: CategoryMember[];
  };
}

class LiquipediaApiClient {
  private readonly cache: CacheInterface;

  protected readonly urlPrefix = 'https://liquipedia.net';

  private readonly userAgent = 'dota2vods.tv Importer (https://github.com/dota2vods/tournament-data;'
    + ' importer@dota2vods.tv)';

  /**
   * Liquipedia has rate limit for its api. It's currently at 1 request per 2 seconds, but we add some puffer.
   *
   * @see https://liquipedia.net/api-terms-of-use
   */
  private readonly minTimeBetweenRequests = 2500;

  private lastRequest = 0;

  public constructor(cache: CacheInterface) {
    this.cache = cache;
  }

  public getWikiAndTitleFromUrl(url: string): [string, string] {
    const wikiEndPosition = url.indexOf('/', this.urlPrefix.length + 1);
    const wiki = url.substring(this.urlPrefix.length + 1, wikiEndPosition);

    // Throw error if the wiki was not found
    if (wiki.startsWith(this.urlPrefix) || wiki.length === 0) {
      throw new ImportError(`Can not extract wiki name from url "${url}".`);
    }

    const title = url.substring(url.indexOf('/', wikiEndPosition) + 1);

    // Throw error if the title was not found
    if (title.length === 0) {
      throw new ImportError(`Can not extract page title from url "${url}".`);
    }

    return [wiki, title];
  }

  public async getCategoryMembers(
    wiki: string,
    categoryTitle: string,
    updateStatus: UpdateStatus,
  ): Promise<CategoryMember[]> {
    // Check if we have a cached item (the pages ina  category don't change that often and this is better for
    // development)
    const cacheKey = [this.urlPrefix, wiki, categoryTitle].join('|');
    const cachedCategoryMembers = await this.cache.get(cacheKey) as CategoryMember[] | null;
    if (cachedCategoryMembers !== null) {
      updateStatus('  Using cache.');

      return cachedCategoryMembers;
    }

    // Result not cached yet, or cache ttl reached, re-fetch category members
    const categoryMembers: CategoryMember[] = [];
    let page = 1;
    let continueLink: null | string = null;
    do {
      updateStatus(`  Loading page ${page}...`);

      // Build query params
      const queryParameters: QueryParameters = {
        action: Action.query,
        format: 'json',
        list: 'categorymembers',
        cmprop: 'title',
        // 500 is the maximum. If we every parse categories with more that 500 tournaments, we need to
        // account for that
        cmlimit: 500,
        cmtitle: categoryTitle,
      };

      // Add continue link if we have one
      if (continueLink) {
        queryParameters.cmcontinue = continueLink;
      }

      // Finally, get the category members from the api
      const {
        continue: apiContinue,
        query: { categorymembers: pageCategoryMembers },
      // We are hitting an api with a rate limit, so we HAVE to wait for the request to succeed before performing the
      // next one.
      // eslint-disable-next-line no-await-in-loop
      } = await this.fetchFromWikiApi<CategoryMembersResponse>(wiki, queryParameters);

      // Add category members on current page to the total list
      categoryMembers.push(...pageCategoryMembers);

      // Check if a have continue link for the next page (no continue means we are done)
      continueLink = typeof apiContinue !== 'undefined' ? apiContinue.cmcontinue : null;
      page++;
    } while (continueLink !== null);

    // Cache for 30 minutes
    await this.cache.set(cacheKey, categoryMembers, 1_800_000); // 30 * 60 * 1000

    // And return the result
    return categoryMembers;
  }

  private fetchFromWikiApi<T>(wiki: string, queryParameters: QueryParameters): Promise<T> {
    return this.fetchJSON<T>(`${this.urlPrefix}/${wiki}/api.php?${querystring.stringify(queryParameters)}`);
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    return (await this.fetch(url)).json();
  }

  /**
   * Wrapper for fetch to follow the Liquipedia API Terms of Use. Returns the parsed json result.
   *
   * @see https://liquipedia.net/api-terms-of-use
   */
  private async fetch(url: string): Promise<Response> {
    // Liquipedia has a rate limit, make sure we don't hit it
    const timeToWait = this.minTimeBetweenRequests - (Date.now() - this.lastRequest);
    if (timeToWait > 0) {
      await sleep(timeToWait);
    }

    // Do the fetch
    const response = await realFetch(url, {
      headers: {
        // Use a custom user agent :)
        'User-Agent': this.userAgent,
      },
    });

    // Update last request time. We don't support parallel fetch calls
    this.lastRequest = Date.now();

    // Return the fetch response
    return response;
  }
}

export default LiquipediaApiClient;
