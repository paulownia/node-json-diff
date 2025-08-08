import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { printJsonFilesDiff } from '../lib/diff-files.js';
import { ArrayWritable, nullWritable } from './utils/writable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('printJsonFilesDiff', () => {
  test('should compare JSON files without throwing', () => {
    /* eslint-disable no-console */
    const leftFile = path.join(__dirname, 'fixtures', 'simple-left.json');
    const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));

    try {
      const logs: string[] = [];
      const arrayWritable = new ArrayWritable(logs);
      printJsonFilesDiff(arrayWritable, leftFile, rightFile);

      // Verify that output was generated
      assert(logs.length > 0, 'Should generate output');

      // Verify file headers are present
      const output = logs.join('\n');
      assert(output.includes('---'), 'Should include left file indicator');
      assert(output.includes('+++'), 'Should include right file indicator');

      // Verify some expected differences are detected
      assert(output.includes('.age'), 'Should detect age change');
      assert(output.includes('.city'), 'Should detect city change');
      assert(output.includes('.hobbies'), 'Should detect hobbies change');

    } finally {
      console.log = originalLog;
    }
    /* eslint-enable no-console */
  });

  test('should throw error for non-existent file', () => {
    const leftFile = path.join(__dirname, 'fixtures', 'non-existent.json');
    const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

    assert.throws(() => {
      printJsonFilesDiff(nullWritable, leftFile, rightFile);
    }, /File not found/);
  });

  test('should throw error for invalid JSON', () => {
    // Create a temporary invalid JSON file
    const invalidJsonPath = path.join(__dirname, 'fixtures', 'invalid.json');

    try {
      fs.writeFileSync(invalidJsonPath, '{ invalid json }');

      const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

      assert.throws(() => {
        printJsonFilesDiff(nullWritable, invalidJsonPath, rightFile);
      }, /Not a valid JSON file/);

    } finally {
      // Clean up
      try {
        fs.unlinkSync(invalidJsonPath);
      } catch (_e) {
        // Ignore cleanup errors
      }
    }
  });

  test('should throw error when acceptJsonc is false and JSONC file is provided', () => {
    const jsoncFile = path.join(__dirname, 'fixtures', 'test.jsonc');
    const jsonFile = path.join(__dirname, 'fixtures', 'simple-right.json');

    // Test with acceptJsonc: false (default)
    assert.throws(() => {
      printJsonFilesDiff(nullWritable, jsoncFile, jsonFile, { arrayDiffAlgorithm: 'elem', acceptJsonc: false });
    }, /Not a valid JSON file/);

    // Test with no options (defaults to acceptJsonc: false)
    assert.throws(() => {
      printJsonFilesDiff(nullWritable, jsoncFile, jsonFile);
    }, /Not a valid JSON file/);
  });

  test('should not throw error when acceptJsonc is true and JSONC file is provided', () => {
    const jsoncFile1 = path.join(__dirname, 'fixtures', 'test.jsonc');
    const jsoncFile2 = path.join(__dirname, 'fixtures', 'test2.jsonc');

    // Should not throw with acceptJsonc: true
    assert.doesNotThrow(() => {
      const logs: string[] = [];
      const arrayWritable = new ArrayWritable(logs);
      printJsonFilesDiff(arrayWritable, jsoncFile1, jsoncFile2, { arrayDiffAlgorithm: 'elem', acceptJsonc: true });

      // Verify that output was generated
      assert(logs.length > 0, 'Should generate output for JSONC files');

      // Verify file headers are present
      const output = logs.join('\n');
      assert(output.includes('---'), 'Should include left file indicator');
      assert(output.includes('+++'), 'Should include right file indicator');
    });
  });

  test('should properly parse and diff JSONC files when acceptJsonc is true', () => {
    const jsoncFile1 = path.join(__dirname, 'fixtures', 'test.jsonc');
    const jsoncFile2 = path.join(__dirname, 'fixtures', 'test2.jsonc');

    const logs: string[] = [];
    const arrayWritable = new ArrayWritable(logs);

    printJsonFilesDiff(arrayWritable, jsoncFile1, jsoncFile2, { arrayDiffAlgorithm: 'elem', acceptJsonc: true });

    const output = logs.join('\n');

    // Verify that differences are detected correctly
    assert(output.includes('.name'), 'Should detect name change from John Doe to Jane Smith');
    assert(output.includes('.age'), 'Should detect age change from 30 to 25');
    assert(output.includes('.city'), 'Should detect city change from New York to San Francisco');
    assert(output.includes('.hobbies'), 'Should detect hobbies change');
  });
});
