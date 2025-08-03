#!/usr/bin/env node

import { parseCliOptions, printUsage, printVersion } from '../lib/cli-options.js';
import { printJsonFilesDiff } from '../lib/diff-files.js';

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
      printUsage(process.stdout);
      return;
    }
    if (version) {
      printVersion(process.stdout);
      return;
    }
    if (!main) {
      printUsage(process.stderr);
      process.exit(1);
    }

    printJsonFilesDiff(
      process.stdout,
      main.file1,
      main.file2,
      {
        arrayDiffAlgorithm: main.arrayDiff,
        arrayKey: main.arrayKey,
        acceptJsonc: main.acceptJsonc,
        color: main.color,
      },
    );

  } catch (error: unknown) {
    if (error instanceof TypeError) { // TypeError for invalid arguments
      printUsage(process.stderr);
    } else if (error instanceof SyntaxError) {
      process.stderr.write(`Error: Not a valid JSON file: ${error.message}\n`);
    } else {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : error}\n`);
    }
    process.exit(1);
  }
}

main();
