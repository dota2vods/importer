import { registry, singleton } from 'tsyringe';
import { parse } from 'node-html-parser';
import {
  ImporterInterfaceToken,
  Tournament,
  TournamentUrlList,
  UpdateStatus,
} from '../ImporterInterface';
import ImportError from '../../ImportError';
import AbstractImporter from '../AbstractImporter';
import LiquipediaApiClient from './LiquipediaApiClient';

@singleton()
@registry([
  { token: ImporterInterfaceToken, useClass: LiquipediaImporter },
])
class LiquipediaImporter extends AbstractImporter {
  protected readonly requiredUrlPrefix = 'https://liquipedia.net';

  public constructor(
    private readonly liquipediaApiClient: LiquipediaApiClient,
  ) {
    super();
  }

  public async importTournament(tournamentUrl: string, updateStatus: UpdateStatus): Promise<Tournament> {
    const [wiki, pageTitle] = this.liquipediaApiClient.getWikiAndTitleFromUrl(tournamentUrl);

    const pageContent = await this.liquipediaApiClient.getParsedPageContent(wiki, pageTitle, updateStatus);
    updateStatus('Page content loaded, parsing tournament...');

    const root = parse(pageContent);

    // TODO: Get meta data via query api and read the name plus all other meta data from there
    // Read content
    const name = root.querySelector('.infobox-header')?.lastChild.text;

    // Find stage links and load them
    const sectionHeaders = root.querySelectorAll('h2 > .mw-headline');
    let stageLinks: string[] = [];
    for (let i = 0; i <= sectionHeaders.length - 1; i++) {
      const sectionHeader = sectionHeaders[i];
      if (sectionHeader.text === 'Results') {
        let nextH2Found = false;
        stageLinks = root.querySelectorAll(`h2:nth-of-type(${i + 1}) ~ h3, h2:nth-of-type(${i + 1}) ~ h2`)
          .filter((section) => {
            if (section.tagName === 'H2') {
              nextH2Found = true;
            }

            return !nextH2Found;
          })
          .map((section) => {
            const href = section.querySelector('a')?.attributes.href as string;

            const query = new URLSearchParams(href.substring(href.indexOf('?') + 1));
            return `${this.requiredUrlPrefix}/${wiki}/${query.get('title')}`;
          })
        ;
        break;
      }
    }

    // TODO: Load stages

    return {
      name,
      stageLinks,
    };
  }

  public async getTournamentUrlsInCollection(
    collectionUrl: string,
    updateStatus: UpdateStatus,
  ): Promise<TournamentUrlList> {
    const [wiki, categoryTitle] = this.liquipediaApiClient.getWikiAndTitleFromUrl(collectionUrl);

    // Throw error if no category url was given
    if (!categoryTitle.startsWith('Category:')) {
      throw new ImportError(`Liquipedia category titles must start with "Category:", "${categoryTitle}" given.`);
    }

    const categoryMembers = await this.liquipediaApiClient.getCategoryMembers(wiki, categoryTitle, updateStatus);

    return categoryMembers.map(({ title: tournamentTitle }) => (
      `${this.requiredUrlPrefix}/${wiki}/${tournamentTitle.replace(/[^:\w/]+/g, '_')}`
    ));
  }
}

export default LiquipediaImporter;
