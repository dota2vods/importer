import { injectAll, registry, singleton } from 'tsyringe';
import { OptionValues } from 'commander';
import { CommandInterfaceToken, Option } from '../types/CommandInterface';
import ImporterInterface, { ImporterInterfaceToken } from '../types/ImporterInterface';
import AbstractCommand, { ForceImporterOptions } from './AbstractCommand';

type ImportCommandOptions = ForceImporterOptions;

@singleton()
@registry([
  { token: CommandInterfaceToken, useClass: ImportCommand },
])
class ImportCommand extends AbstractCommand {
  public constructor(
    @injectAll(ImporterInterfaceToken)
    protected readonly importers: ImporterInterface[],
  ) {
    super();
  }

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
