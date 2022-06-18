import { singleton } from 'tsyringe';
import realFetch, { Response } from 'node-fetch';
import sleep from 'sleep-promise';
import { UpdateStatus } from '../ImporterInterface';
import FileSystemCache from '../../Cache/FileSystemCache';
import ImportError from '../../ImportError';

enum Action {
  query = 'query',
  parse = 'parse',
}

interface QueryParameters extends Record<string, string> {
  action: Action;
}

interface RevisionsResponse {
  query: {
    pages: {
      [pageId: string]: {
        revisions: {
          revid: number;
        }[];
      };
    };
  };
}

interface ParsedPageResponse {
  parse: {
    title: string;
    pageid: number;
    text: {
      '*': string;
    };
  };
}

interface CategoryMember {
  title: string;
}

interface CategoryMembersResponse {
  continue?: {
    cmcontinue: string;
    continue: string;
  };
  query: {
    categorymembers: CategoryMember[];
  };
}

@singleton()
class LiquipediaApiClient {
  protected readonly urlPrefix = 'https://liquipedia.net';

  private readonly userAgent = 'dota2vods.tv Importer (https://github.com/dota2vods/tournament-data;'
    + ' importer@dota2vods.tv)';

  /**
   * Defines the wait times for when hitting the Liquipedia api, so we don't hit the rate limit.
   *
   * @see https://liquipedia.net/api-terms-of-use
   */
  private readonly minTimeBetweenRequests = {
    [Action.query]: 2500,
    [Action.parse]: 35000,
  };

  /**
   * The unix timestamp after which we can call the Liquipedia api again.
   *
   * Gets set based on the {@link minTimeBetweenRequests} values.
   */
  private nextRequestAt = 0;

  public constructor(
    private readonly cache: FileSystemCache,
  ) {
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

  public async getParsedPageContent(wiki: string, pageTitle: string, updateStatus: UpdateStatus): Promise<string> {
    // Get the latest revision id. This way we can cache the page forever. Until it gets a new revision.
    const revisionsResponse = await this.fetchFromWikiApi<RevisionsResponse>(wiki, {
      action: Action.query,
      format: 'json',
      titles: pageTitle,
      prop: 'revisions',
      rvlimit: '1',
      rvprop: 'ids',
    });
    const latestRevisionId = Object.values(revisionsResponse.query.pages)[0].revisions[0].revid;
    updateStatus(`  Latest revision for ${pageTitle} is ${latestRevisionId}.`);

    // Check if we have a cached item
    const cacheKey = [this.urlPrefix, wiki, 'pageContent', latestRevisionId].join('|');
    const cachedPageContent = await this.cache.get(cacheKey) as string | null;
    if (cachedPageContent !== null) {
      updateStatus('  Using cache.');

      return cachedPageContent;
    }

    // Result not cached yet, or cache ttl reached, re-fetch page content
    const { parse: { text: { '*': pageContent } } } = await this.fetchFromWikiApi<ParsedPageResponse>(wiki, {
      action: Action.parse,
      format: 'json',
      oldid: latestRevisionId.toString(),
      prop: 'text',
    });

    // Cache revision forever, it will not change
    await this.cache.set(cacheKey, pageContent);

    return pageContent;
  }

  public async getCategoryMembers(
    wiki: string,
    categoryTitle: string,
    updateStatus: UpdateStatus,
  ): Promise<CategoryMember[]> {
    // Check if we have a cached item (the pages ina  category don't change that often and this is better for
    // development)
    const cacheKey = [this.urlPrefix, wiki, 'categoryMembers', categoryTitle].join('|');
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
        cmtitle: categoryTitle,
        // 500 is the maximum. If we every parse categories with more than 500 tournaments, we need to
        // account for that
        cmlimit: '500',
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
    return this.fetchJSON<T>(
      `${this.urlPrefix}/${wiki}/api.php?${new URLSearchParams(queryParameters)}`,
      queryParameters.action,
    );
  }

  private async fetchJSON<T>(url: string, action: Action = Action.query): Promise<T> {
    return (await this.fetch(url, action)).json();
  }

  /**
   * Wrapper for fetch to follow the Liquipedia API Terms of Use.
   *
   * @see https://liquipedia.net/api-terms-of-use
   */
  private async fetch(url: string, action: Action = Action.query): Promise<Response> {
    // Liquipedia has a rate limit, make sure we don't hit it
    const timeToWait = this.nextRequestAt - Date.now();
    if (timeToWait > 0) {
      console.log(`--- [fetch] Waiting ${timeToWait / 1000} seconds... ---`);

      await sleep(timeToWait);
    }

    // Do the fetch
    // Note: We are using node-fetch which automatically sets the "Accept-Encoding: gzip" header required by the
    //       Liquipedia API terms of use.
    const response = await realFetch(url, {
      headers: {
        // Use a custom user agent :)
        'User-Agent': this.userAgent,
      },
    });

    // Update next request time. We don't support parallel fetch calls.
    this.nextRequestAt = Date.now() + this.minTimeBetweenRequests[action];

    // Return the fetch response
    return response;
  }
}

export default LiquipediaApiClient;
