import Named from '../Named/Named';

export type UpdateStatus = (status: string) => void;

export interface Tournament {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}

export type TournamentUrlList = string[];

export const ImporterInterfaceToken = 'ImporterInterface';

interface ImporterInterface extends Named {
  supports(url: string): boolean;

  importTournament(tournamentUrl: string, updateStatus: UpdateStatus): Promise<Tournament>;

  getTournamentUrlsInCollection(collectionUrl: string, updateStatus: UpdateStatus): Promise<TournamentUrlList>;
}

export default ImporterInterface;
