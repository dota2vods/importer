import Named from './Named';

export type UpdateStatus = (status: string) => void;

export interface Tournament {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}

export interface TournamentList {
  [name: string]: Tournament;
}

interface ImporterInterface extends Named {
  supports(url: string): boolean;

  importTournament(tournamentUrl: string, updateStatus: UpdateStatus): Promise<Tournament>;

  importCollection(collectionUrl: string, updateStatus: UpdateStatus): Promise<TournamentList>;
}

export default ImporterInterface;
