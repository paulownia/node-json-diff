import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { diffJsonValues } from './diff.js';
import { toPathJqQuery } from './pathUtil.js';

export function diffJsonFiles(file1, file2) {
    const json1 = JSON.parse(fs.readFileSync(path.resolve(file1), 'utf8'));
    const json2 = JSON.parse(fs.readFileSync(path.resolve(file2), 'utf8'));
    return diffJsonValues(json1, json2);
}

export function printJsonFilesDiff(file1, file2) {
    try {
        const diffList = diffJsonFiles(file1, file2);

        console.log(chalk.cyan(`--- ${file1}`));
        console.log(chalk.cyan(`+++ ${file2}`));

        for (const diffItem of diffList) {
            console.log(`@ ${toPathJqQuery(diffItem.path)} (${diffItem.type})`);

            if (diffItem.lhs !== undefined) {
            console.log(chalk.red(`  - ${JSON.stringify(diffItem.lhs, null, 0)}`));
            }
            if (diffItem.rhs !== undefined) {
            console.log(chalk.green(`  + ${JSON.stringify(diffItem.rhs, null, 0)}`));
            }
        }
    } catch (e) {
        if (e.code === 'ENOENT') throw new Error(`File not found: ${e.path}`);
        if (e.code === 'EISDIR') throw new Error(`Expected a file but found a directory: ${e.path}`);
        if (e.code === 'EACCES') throw new Error(`Permission denied: ${e.path}`);
        if (e instanceof SyntaxError) throw new Error(`Not a valid JSON file: ${e.message}`);
        throw e;
    }
}
