#!/usr/bin/env node

import path from 'path';
import { Command as Program } from 'commander';
import ImportError from './ImportError';
import importFactoriesFromFolder from './importFactoriesFromFolder';
import CommandInterface from './types/CommandInterface';
import ImporterInterface from './types/ImporterInterface';

const argumentListToString = (argumentList: Array<string>) => argumentList.map(
  (argument) => `<${argument}>`,
).join(' ');

(async () => {
  // Create base program
  const program = new Program();
  program
    .name('dota2vods-importers')
    .usage('[command] [argument]')
    .description('Command to automatically import and update tournament data for the dota2vods/tournament-data'
      + ' project.')
  ;

  // Load importers and command definitions
  const importers = await importFactoriesFromFolder<ImporterInterface>(path.join(__dirname, 'importers'));
  const commands = await importFactoriesFromFolder<CommandInterface>(path.join(__dirname, 'commands'), [
    importers,
  ]);

  // Register commands
  for (const command of commands) {
    const commandDefinition = program
      .command(`${command.getName()} ${argumentListToString(command.getArguments())}`.trim(), {
        isDefault: command.isDefault(),
      })
      .description(command.getDescription())
      .action((...args) => command.execute(commandDefinition.opts(), ...args).catch((error) => {
        if (!(error instanceof ImportError)) {
          throw error;
        }

        // eslint-disable-next-line no-console
        console.error(error.toString());
        process.exit(error.getExitCode());
      }))
    ;

    for (const option of command.getOptions()) {
      const shortName = option.short ? `-${option.short},` : '';
      const argumentString = argumentListToString(option.arguments || []);
      commandDefinition.option(`${shortName} --${option.name} ${argumentString}`.trim(), option.description);
    }
  }

  // Finally, start the program
  program.parse(process.argv);
})();
