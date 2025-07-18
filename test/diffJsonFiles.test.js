import { test, describe } from 'node:test';
import assert from 'node:assert';
import { printJsonFilesDiff } from '../index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('printJsonFilesDiff', () => {
  test('should compare JSON files without throwing', () => {
    const leftFile = path.join(__dirname, 'fixtures', 'simple-left.json');
    const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

    // Capture console output
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    try {
      printJsonFilesDiff(leftFile, rightFile);

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
  });

  test('should throw error for non-existent file', () => {
    const leftFile = path.join(__dirname, 'fixtures', 'non-existent.json');
    const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

    assert.throws(() => {
      printJsonFilesDiff(leftFile, rightFile);
    }, /File not found/);
  });

  test('should throw error for invalid JSON', async () => {
    // Create a temporary invalid JSON file
    const fs = await import('node:fs');
    const invalidJsonPath = path.join(__dirname, 'fixtures', 'invalid.json');

    try {
      fs.writeFileSync(invalidJsonPath, '{ invalid json }');

      const rightFile = path.join(__dirname, 'fixtures', 'simple-right.json');

      assert.throws(() => {
        printJsonFilesDiff(invalidJsonPath, rightFile);
      }, /Not a valid JSON file/);

    } finally {
      // Clean up
      try {
        fs.unlinkSync(invalidJsonPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
