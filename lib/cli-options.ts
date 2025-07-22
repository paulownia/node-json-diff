import yargs from 'yargs';
import { ArrayDiffAlgorithm } from './types.js';

export interface CliOptions {
  file1: string;
  file2: string;
  arrayDiff: ArrayDiffAlgorithm;
}

/**
 * Parse command line options for the JSON diff tool. argv is the command line arguments array.
 */
export function parseCliOptions(argv: string[]): CliOptions {
  const parsed = yargs(argv)
    .usage('Usage: $0 <file1.json> <file2.json> [options]')
    .option('array-diff', {
      alias: 'a',
      choices: ['elem', 'lcs', 'set'] as const,
      default: 'elem',
      describe: 'Array diff algorithm (elem, lcs, set)',
      type: 'string',
    })
    .demandCommand(2)
    .help(true)
    .parseSync();

  return {
    file1: parsed._[0] as string,
    file2: parsed._[1] as string,
    arrayDiff: parsed['array-diff'] as ArrayDiffAlgorithm,
  };
}
