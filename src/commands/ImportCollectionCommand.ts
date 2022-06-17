import { OptionValues } from 'commander';
import CommandFactory from '../types/CommandFactory';
import { Option } from '../types/CommandInterface';
import ImporterInterface from '../types/ImporterInterface';
import AbstractCommand, { ForceImporterOptions } from './AbstractCommand';

type ImportCollectionCommandOptions = ForceImporterOptions;

class ImportCollectionCommand extends AbstractCommand {
  public getDescription(): string {
    return 'Import or update all tournaments of a collection (mainly used for automation).';
  }

  public getArguments(): string[] {
    return ['collection_url'];
  }

  public getOptions(): Option[] {
    return [
      ...this.getForceImporterOptions(),
    ];
  }

  public async execute(options: OptionValues & ImportCollectionCommandOptions, collectionUrl: string): Promise<void> {
    const importer = this.selectImporter(collectionUrl, options);

    this.updateStatus(`Loading tournament urls from url ${collectionUrl}...`);
    const tournamentList = await importer.getTournamentUrlsInCollection(
      collectionUrl,
      this.updateStatus.bind(this),
    );

    this.updateStatus('Got tournament urls, importing each of them now...');
    for (let i = 0; i <= tournamentList.length - 1; i++) {
      const tournamentUrl = tournamentList[i];
      this.updateStatus(`Importing tournament ${i + 1}/${tournamentList.length}... -> ${tournamentUrl}`);

      // We are hitting an api with a rate limit, so we HAVE to wait for the request to succeed before performing the
      // next one.
      // eslint-disable-next-line no-await-in-loop
      const tournament = await importer.importTournament(tournamentUrl, this.updateStatus.bind(this));

      // TODO: Send to yaml dumper
      console.log(tournament);
    }

    this.updateStatus('Done. Imported all tournaments in collection url.');
  }
}

export default ImportCollectionCommand;

export const factory: CommandFactory = (importers: ImporterInterface[]) => new ImportCollectionCommand(importers);
