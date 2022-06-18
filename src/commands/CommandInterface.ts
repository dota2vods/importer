import { OptionValues } from 'commander';
import Named from '../common/Named';

export interface Option {
  name: string;
  short?: string;
  description: string;
  arguments?: Array<string>;
}

export const CommandInterfaceToken = 'CommandInterface';

interface CommandInterface extends Named {
  getDescription(): string;
  getArguments(): Array<string>;
  getOptions(): Option[];
  isDefault(): boolean;
  execute(options: OptionValues, ...argumentValues: string[]): Promise<void>;
}

export default CommandInterface;
