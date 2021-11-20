import CommandFactory from '../types/CommandFactory';
import ImporterInterface from '../types/ImporterInterface';
import AbstractCommand from './AbstractCommand';

class ListImportersCommand extends AbstractCommand {
  public getDescription(): string {
    return 'Lists all available importers.';
  }

  public async execute(): Promise<void> {
    console.log(this.importers.map((importer) => importer.getName()).join('\n'));
  }
}

export default ListImportersCommand;

export const factory: CommandFactory = (importers: ImporterInterface[]) => new ListImportersCommand(importers);
