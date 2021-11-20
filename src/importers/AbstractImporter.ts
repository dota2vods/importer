import AbstractNamed from '../common/AbstractNamed';
import ImporterInterface, { UpdateStatus, Tournament, TournamentList } from '../types/ImporterInterface';

abstract class AbstractImporter extends AbstractNamed implements ImporterInterface {
  protected readonly nameSuffix = 'Importer';

  protected abstract readonly requiredUrlPrefix: string;

  public supports(url: string): boolean {
    return url.startsWith(this.requiredUrlPrefix);
  }

  public abstract importTournament(tournamentUrl: string, updateStatus: UpdateStatus): Promise<Tournament>;

  public abstract importCollection(collectionUrl: string, updateStatus: UpdateStatus): Promise<TournamentList>;
}

export default AbstractImporter;
