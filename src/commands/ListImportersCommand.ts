import { injectAll, registry, singleton } from 'tsyringe';
import { CommandInterfaceToken } from '../types/CommandInterface';
import ImporterInterface, { ImporterInterfaceToken } from '../types/ImporterInterface';
import AbstractCommand from './AbstractCommand';

@singleton()
@registry([
  { token: CommandInterfaceToken, useClass: ListImportersCommand },
])
class ListImportersCommand extends AbstractCommand {
  public constructor(
    @injectAll(ImporterInterfaceToken)
    protected readonly importers: ImporterInterface[],
  ) {
    super();
  }

  public getDescription(): string {
    return 'Lists all available importers.';
  }

  public async execute(): Promise<void> {
    console.log(this.importers.map((importer) => importer.getName()).join('\n'));
  }
}

export default ListImportersCommand;
