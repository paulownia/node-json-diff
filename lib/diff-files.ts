import chalk from 'chalk';
import { parse as parseJsonc } from 'jsonc-parser';
import fs from 'node:fs';
import path from 'node:path';
import { Writable } from 'node:stream';
import { diffJsonValues } from './diff.js';
import { pathArrayToJqQuery } from './jq-query.js';
import { DiffItem, DiffOptions, JsonValue, OutputOptions, ParserOptions } from './types.js';

/**
 * Configure chalk color output based on CLI options and environment variables
 *
 * Environment variable support:
 * - FORCE_COLOR: handled automatically by chalk (FORCE_COLOR=1 enables, FORCE_COLOR=0 disables)
 * - NO_COLOR: handled manually (chalk doesn't support this standard)
 *
 * Priority: CLI options > Environment variables > TTY detection (chalk automatic)
 */
export function configureChalkColors(forceColor?: boolean): void {
  if (forceColor === true) {
    chalk.level = 3; // Force full color support
  } else if (forceColor === false) {
    chalk.level = 0; // Disable all colors
  } else if (process.env.NO_COLOR) {
    // NO_COLOR is not supported by chalk, handle it manually
    chalk.level = 0; // Disable all colors
  }
  // Otherwise, use chalk's automatic detection (includes FORCE_COLOR)
}

export function diffJsonFiles(file1: string, file2: string, options: DiffOptions & ParserOptions = { arrayDiffAlgorithm: 'elem', acceptJsonc: false }): DiffItem[] {
  const parseFunc = options.acceptJsonc ? parseJsonc : JSON.parse;
  const json1 = parseJsonFile(parseFunc, file1);
  const json2 = parseJsonFile(parseFunc, file2);
  return diffJsonValues(json1, json2, [], options);
}

function parseJsonFile(parseFunc: (notation: string) => JsonValue, fileName: string): JsonValue {
  try {
    return parseFunc(fs.readFileSync(path.resolve(fileName), 'utf8'));
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Not a valid JSON file: ${fileName}`);
    }
    if (isNodeErrno(e)) {
      if (e.code === 'ENOENT') throw new Error(`File not found: ${e.path}`);
      if (e.code === 'EISDIR') throw new Error(`Expected a file but found a directory: ${e.path}`);
      if (e.code === 'EACCES') throw new Error(`Permission denied: ${e.path}`);
    }
    throw new Error(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function printJsonFilesDiff(
  out: Writable,
  file1: string,
  file2: string,
  options: DiffOptions & ParserOptions & OutputOptions = { arrayDiffAlgorithm: 'elem', acceptJsonc: false }): void {

  // Configure colors before printing
  configureChalkColors(options.color);

  const diffList = diffJsonFiles(file1, file2, options);

  out.write(chalk.cyan(`--- ${file1}`) + '\n');
  out.write(chalk.cyan(`+++ ${file2}`) + '\n');

  for (const diffItem of diffList) {
    out.write(`@ ${pathArrayToJqQuery(diffItem.path)} (${diffItem.type})\n`);

    if (diffItem.lhs !== undefined) {
      out.write(chalk.red(`  - ${JSON.stringify(diffItem.lhs, null, 0)}`) + '\n');
    }
    if (diffItem.rhs !== undefined) {
      out.write(chalk.green(`  + ${JSON.stringify(diffItem.rhs, null, 0)}`) + '\n');
    }
  }
}

interface NodeErrno extends Error {
  code: string;
  errno: number;
  path: string;
}

function isNodeErrno(e: unknown): e is NodeErrno {
  if (!(e instanceof Error)) return false;
  const err = e as NodeErrno;
  return (
    'code' in err && typeof err.code === 'string' &&
    'errno' in err && typeof err.errno === 'number' &&
    'path' in err && typeof err.path === 'string'
  );
}
