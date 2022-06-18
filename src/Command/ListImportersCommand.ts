import { injectAll, registry, singleton } from 'tsyringe';
import ImporterInterface, { ImporterInterfaceToken } from '../Importer/ImporterInterface';
import { CommandInterfaceToken } from './CommandInterface';
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
