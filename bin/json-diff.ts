#!/usr/bin/env node

import { printJsonFilesDiff } from '../index.js';
import { parseCliOptions, printUsage, printVersion } from '../lib/cli-options.js';
import { Writable } from 'node:stream';

const out = new Writable({
  write(chunk, encoding, callback) {
    process.stdout.write(chunk, encoding);
    process.stdout.write('\n');
    callback();
  },
});

/**
 * entry point
 */
function main(): void {
  try {
    const {
      main,
      help,
      version,
    } = parseCliOptions(process.argv.slice(2));

    if (help) {
      printUsage(out);
      return;
    }
    if (version) {
      printVersion(out);
      return;
    }
    if (!main) {
      printUsage(out);
      process.exit(1);
    }

    printJsonFilesDiff(out, main.file1, main.file2, { arrayDiffAlgorithm: main.arrayDiff });

  } catch (error: unknown) {
    if (error instanceof TypeError) { // TypeError for invalid arguments
      printUsage(out);
    } else {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : error}\n`);
    }
    process.exit(1);
  }
}

main();
