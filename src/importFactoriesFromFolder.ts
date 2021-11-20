import path from 'path';
import { readdir } from 'fs/promises';

export default async <T>(folder: string, factoryArguments: Array<unknown> = []): Promise<Array<T>> => {
  // Read folder contents
  const importTargets = await readdir(folder);

  // Import all first level folders or files
  const importPromises: Array<Promise<CallableFunction|undefined>> = [];
  for (const importerFolder of importTargets) {
    importPromises.push(
      import(path.join(folder, importerFolder)).then(({ factory }: {factory?: CallableFunction}) => factory),
    );
  }

  // Wait for the imports to finish
  const factories = await Promise.all(importPromises);

  // And resolve the factories
  const resolvedFactories: Array<T> = [];
  for (const factory of factories) {
    if (typeof factory === 'undefined') {
      // We only want to include files that export a factory
      continue;
    }

    // Call the factory and save the result
    resolvedFactories.push(factory(...factoryArguments));
  }

  // Finally return them all
  return resolvedFactories;
};
