import ImporterInterface, { UpdateStatus, Tournament, TournamentUrlList } from './ImporterInterface';
import AbstractNamed from '../Named/AbstractNamed';

abstract class AbstractImporter extends AbstractNamed implements ImporterInterface {
  protected readonly nameSuffix = 'Importer';

  protected abstract readonly requiredUrlPrefix: string;

  public supports(url: string): boolean {
    return url.startsWith(this.requiredUrlPrefix);
  }

  public abstract importTournament(tournamentUrl: string, updateStatus: UpdateStatus): Promise<Tournament>;

  public abstract getTournamentUrlsInCollection(
    collectionUrl: string,
    updateStatus: UpdateStatus,
  ): Promise<TournamentUrlList>;
}

export default AbstractImporter;
