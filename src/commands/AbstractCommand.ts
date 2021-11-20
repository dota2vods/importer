import { OptionValues } from 'commander';
import ImportError from '../ImportError';
import AbstractNamed from '../common/AbstractNamed';
import CommandInterface, { Option } from '../types/CommandInterface';
import ImporterInterface from '../types/ImporterInterface';

export interface ForceImporterOptions {
  importer?: string;
}

abstract class AbstractCommand extends AbstractNamed implements CommandInterface {
  protected readonly nameSuffix = 'Command';

  protected readonly importers: ImporterInterface[];

  public constructor(importers: ImporterInterface[]) {
    super();

    this.importers = importers;
  }

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
}

export default AbstractCommand;
