import { readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { parseArgs } from 'node:util';
import { ArrayDiffAlgorithm } from './types.js';

export interface CliOptions {
  main?: {
    file1: string;
    file2: string;
    arrayDiff: ArrayDiffAlgorithm;
  }
  help?: boolean;
  version?: boolean;
}

const options = {
  'array-diff': {
    type: 'string',
    default: 'elem',
    short: 'a',
    description: 'Array diff algorithm (elem, lcs, set)',
  },
  'help': {
    type: 'boolean',
    short: 'h',
    description: 'Show help',
  },
  'version': {
    type: 'boolean',
    short: 'v',
    description: 'Show version',
  },
} as const;

/**
 * Parse command line options for the JSON diff tool. argv is the command line arguments array.
 */
export function parseCliOptions(args: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args,
    options,
    allowPositionals: true,
  });

  if (values['help']) return { help: true };
  if (values['version']) return { version: true };

  if (positionals.length !== 2) {
    throw new TypeError('Exactly two positional arguments are required: <file1> <file2>');
  }
  const arrayDiff = values['array-diff'] || 'elem' as ArrayDiffAlgorithm;
  if (!['elem', 'lcs', 'set'].includes(arrayDiff)) {
    throw new TypeError(`Invalid array diff algorithm: ${arrayDiff}. Must be one of 'elem', 'lcs', or 'set'.`);
  }

  return {
    main: {
      file1: positionals[0],
      file2: positionals[1],
      arrayDiff: (values['array-diff'] || 'elem') as ArrayDiffAlgorithm,
    },
  };
}

export function printVersion(writer: Writable) {
  const packageJson = loadPackageJson();
  writer.write(packageJson.version);
  writer.write('\n');
}

export function printUsage(writer: Writable) {
  writer.write([
    'Usage: json-diff [options] <file1> <file2>',
    'Options:',
    '  -a, --array-diff <algorithm>  Array diff algorithm (elem, lcs, set)',
    '  -h, --help                    Show help',
    '  -v, --version                 Show version',
  ].join('\n'));
  writer.write('\n');
}

function loadPackageJson(): { version: string, description: string } {
  try {
    return JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string, description: string };
  } catch (error) {
    throw new Error('Error reading package.json:', { cause: error });
  }
}
