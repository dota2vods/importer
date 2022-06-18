import { OptionValues } from 'commander';
import ImporterInterface from '../importers/ImporterInterface';
import CommandInterface, { Option } from './CommandInterface';
import AbstractNamed from '../common/AbstractNamed';
import ImportError from '../ImportError';

export interface ForceImporterOptions {
  importer?: string;
}

abstract class AbstractCommand extends AbstractNamed implements CommandInterface {
  protected readonly nameSuffix = 'Command';

  protected abstract readonly importers: ImporterInterface[];

  public abstract getDescription(): string;

  public getArguments(): Array<string> {
    return [];
  }

  public getOptions(): Option[] {
    return [];
  }

  public isDefault(): boolean {
    return false;
  }

  public abstract execute(options: OptionValues, ...argumentValues: string[]): Promise<void>;

  protected getForceImporterOptions(): Option[] {
    return [
      {
        name: 'importer',
        short: 'i',
        description: 'Force the use of a specific importer. If not set, the importer will be selected based on the'
          + ' url.',
        arguments: ['importer_name'],
      },
    ];
  }

  protected selectImporter(url: string, options: ForceImporterOptions): ImporterInterface {
    // If the user manually set an importer, select the importer that has the provided name
    if (options.importer) {
      for (const importer of this.importers) {
        if (importer.getName() === options.importer) {
          return importer;
        }
      }

      throw new ImportError(`Importer "${options.importer}" does not exist.`);
    }

    // Else select the importer based on the url
    for (const importer of this.importers) {
      if (importer.supports(url)) {
        return importer;
      }
    }

    throw new ImportError(`Could not find an importer that supports "${url}".`);
  }

  protected updateStatus(status: string) : void {
    console.log(status);
  }
}

export default AbstractCommand;
