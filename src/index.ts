#!/usr/bin/env node

import 'reflect-metadata';
import { container } from 'tsyringe';
import { Command as Program } from 'commander';
import CommandInterface, { CommandInterfaceToken } from './commands/CommandInterface';
import DependencyInjectionAutoloader from './DependencyInjectionAutoloader';
import ImportError from './ImportError';

const argumentListToString = (argumentList: Array<string>) => argumentList.map(
  (argument) => `<${argument}>`,
).join(' ');

(async () => {
  // Load all definitions, so they are registered in the dependency injection
  await (new DependencyInjectionAutoloader()).loadAllInFolder(__dirname, [__filename]);

  // Create base program
  const program = new Program();
  program
    .name('dota2vods-importer')
    .usage('[command] [argument]')
    .description('Command to automatically import and update tournament data for the dota2vods/tournament-data'
      + ' project.')
  ;

  // Register commands
  const commands = container.resolveAll<CommandInterface>(CommandInterfaceToken);
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
