import ImporterFactory from '../../types/ImporterFactory';
import { UpdateStatus, Tournament, TournamentList } from '../../types/ImporterInterface';
import AbstractImporter from '../AbstractImporter';

class LiquipediaImporter extends AbstractImporter {
  protected readonly requiredUrlPrefix = 'https://liquipedia.net';

  public async importTournament(url: string, updateStatus: UpdateStatus): Promise<Tournament> {
    updateStatus(`Starting import of ${url}...`);

    return {
      url,
    };
  }

  public async importCollection(collectionUrl: string, updateStatus: UpdateStatus): Promise<TournamentList> {
    updateStatus('Returning an empty list. The liquipedia importer does not yet support importing collections.');

    return {};
  }
}

export default LiquipediaImporter;

export const factory: ImporterFactory = () => new LiquipediaImporter();
