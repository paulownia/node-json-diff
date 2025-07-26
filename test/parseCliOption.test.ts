import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseCliOptions } from '../lib/cli-options.js';

describe('parseCliOptions', () => {
  test('should parse basic file arguments', () => {
    const result = parseCliOptions(['file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'elem',
      },
    });
  });

  test('should return help flag when -h is provided', () => {
    const result = parseCliOptions(['-h']);

    assert.deepStrictEqual(result, {
      help: true,
    });
  });

  test('should return help flag when --help is provided', () => {
    const result = parseCliOptions(['--help']);

    assert.deepStrictEqual(result, {
      help: true,
    });
  });

  test('should return version flag when -v is provided', () => {
    const result = parseCliOptions(['-v']);

    assert.deepStrictEqual(result, {
      version: true,
    });
  });

  test('should return version flag when --version is provided', () => {
    const result = parseCliOptions(['--version']);

    assert.deepStrictEqual(result, {
      version: true,
    });
  });

  test('should parse array-diff option with short flag', () => {
    const result = parseCliOptions(['-a', 'lcs', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'lcs',
      },
    });
  });

  test('should parse array-diff option with long flag', () => {
    const result = parseCliOptions(['--array-diff', 'set', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'set',
      },
    });
  });

  test('should use default array-diff algorithm when not specified', () => {
    const result = parseCliOptions(['file1.json', 'file2.json']);

    assert.strictEqual(result.main?.arrayDiff, 'elem');
  });

  test('should throw error when less than 2 files are provided', () => {
    assert.throws(() => {
      parseCliOptions(['file1.json']);
    }, {
      name: 'TypeError',
      message: 'Exactly two positional arguments are required: <file1> <file2>',
    });
  });

  test('should throw error when no files are provided', () => {
    assert.throws(() => {
      parseCliOptions([]);
    }, {
      name: 'TypeError',
      message: 'Exactly two positional arguments are required: <file1> <file2>',
    });
  });

  test('should throw error for invalid array-diff algorithm', () => {
    assert.throws(() => {
      parseCliOptions(['--array-diff', 'invalid', 'file1.json', 'file2.json']);
    }, {
      name: 'TypeError',
      message: 'Invalid array diff algorithm: invalid. Must be one of \'elem\', \'lcs\', or \'set\'.',
    });
  });

  test('should accept all valid array-diff algorithms', () => {
    const algorithms = ['elem', 'lcs', 'set'];

    algorithms.forEach(algorithm => {
      const result = parseCliOptions(['--array-diff', algorithm, 'file1.json', 'file2.json']);
      assert.strictEqual(result.main?.arrayDiff, algorithm);
    });
  });

  test('should throw error when more than 2 files are provided', () => {
    assert.throws(() => {
      parseCliOptions(['file1.json', 'file2.json', 'extra.json']);
    }, {
      name: 'TypeError',
      message: 'Exactly two positional arguments are required: <file1> <file2>',
    });
  });

  test('should prioritize help over other options', () => {
    const result = parseCliOptions(['--help', '--version', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      help: true,
    });
  });

  test('should prioritize version over file arguments but not help', () => {
    const result = parseCliOptions(['--version', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      version: true,
    });
  });

  test('should handle mixed short and long options', () => {
    const result = parseCliOptions(['-a', 'lcs', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'lcs',
      },
    });
  });

  test('should handle options in different positions', () => {
    const result = parseCliOptions(['file1.json', '--array-diff', 'set', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'set',
      },
    });
  });
});
