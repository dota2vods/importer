import { OptionValues } from 'commander';
import CommandFactory from '../types/CommandFactory';
import { Option } from '../types/CommandInterface';
import ImporterInterface from '../types/ImporterInterface';
import AbstractCommand, { ForceImporterOptions } from './AbstractCommand';

type ImportCollectionCommandOptions = ForceImporterOptions

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

    const tournamentList = await importer.importCollection(collectionUrl, (status) => console.log(status));
    console.log(tournamentList);
  }
}

export default ImportCollectionCommand;

export const factory: CommandFactory = (importers: ImporterInterface[]) => new ImportCollectionCommand(importers);
