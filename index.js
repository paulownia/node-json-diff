import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { diffJsonValues } from './lib/diff.js';
import { toPathJqQuery } from './lib/pathUtil.js';

/**
 * Compare two JSON files and output the differences
 * @param {string} file1 - Path to the first JSON file
 * @param {string} file2 - Path to the second JSON file
 */
export function diffJsonFiles(file1, file2) {
  try {
    const json1 = JSON.parse(fs.readFileSync(path.resolve(file1), 'utf8'));
    const json2 = JSON.parse(fs.readFileSync(path.resolve(file2), 'utf8'));

    console.log(chalk.cyan(`--- ${file1}`));
    console.log(chalk.cyan(`+++ ${file2}`));

    const diffList = diffJsonValues(json1, json2);
    for (const diffItem of diffList) {
      console.log(`@ ${toPathJqQuery(diffItem.path)} (${diffItem.type})`);

      if (diffItem.lhs !== undefined) {
        console.log(chalk.red(`  - ${JSON.stringify(diffItem.lhs, null, 0)}`));
      }
      if (diffItem.rhs !== undefined) {
        console.log(chalk.green(`  + ${JSON.stringify(diffItem.rhs, null, 0)}`));
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${error.path}`);
    } else if (error.code === 'EISDIR') {
      throw new Error(`Expected a file but found a directory: ${error.path}`);
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${error.path}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Not a valid JSON file: ${error.message}`);
    } else {
      throw error;
    }
  }
}
