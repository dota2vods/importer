import { registry, singleton } from 'tsyringe';
import sleep from 'sleep-promise';
import {
  ImporterInterfaceToken,
  Tournament,
  TournamentUrlList,
  UpdateStatus,
} from '../../types/ImporterInterface';
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

  public async importTournament(url: string): Promise<Tournament> {
    // Simulate api requests
    await sleep(3000);

    return {
      url,
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
      `${this.requiredUrlPrefix}/${wiki}/${tournamentTitle.replace(/[^\w/]+/g, '_')}`
    ));
  }
}

export default LiquipediaImporter;
