import { OptionValues } from 'commander';
import CommandFactory from '../types/CommandFactory';
import { Option } from '../types/CommandInterface';
import ImporterInterface from '../types/ImporterInterface';
import AbstractCommand, { ForceImporterOptions } from './AbstractCommand';

type ImportCommandOptions = ForceImporterOptions;

class ImportCommand extends AbstractCommand {
  public getDescription(): string {
    return 'Import a new tournament or update an existing one. (Default behaviour if no command is specified)';
  }

  public getArguments(): string[] {
    return ['tournament_url'];
  }

  public getOptions(): Option[] {
    return [
      ...this.getForceImporterOptions(),
    ];
  }

  public isDefault(): boolean {
    return true;
  }

  public async execute(options: OptionValues & ImportCommandOptions, tournamentUrl: string): Promise<void> {
    const importer = this.selectImporter(tournamentUrl, options);

    this.updateStatus(`Importing tournament ${tournamentUrl}...`);
    const tournament = await importer.importTournament(tournamentUrl, this.updateStatus.bind(this));

    // TODO: Send to yaml dumper
    console.log(tournament);
  }
}

export default ImportCommand;

export const factory: CommandFactory = (importers: ImporterInterface[]) => new ImportCommand(importers);
