import { OptionValues } from 'commander';
import ImporterInterface from './ImporterInterface';
import Named from './Named';

export interface Option {
  name: string;
  short?: string;
  description: string;
  arguments?: Array<string>;
}

interface CommandInterface extends Named {
  getDescription(): string;
  getArguments(): Array<string>;
  getOptions(): Option[];
  isDefault(): boolean;
  execute(options: OptionValues, ...argumentValues: string[]): Promise<void>;
}

interface CommandInterfaceConstructor {
  new(importers: ImporterInterface[]): CommandInterface;
}

declare const CommandInterface: CommandInterfaceConstructor;

export default CommandInterface;
