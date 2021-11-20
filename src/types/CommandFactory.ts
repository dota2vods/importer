import CommandInterface from './CommandInterface';
import ImporterInterface from './ImporterInterface';

type CommandFactory = (importers: ImporterInterface[]) => CommandInterface;

export default CommandFactory;
