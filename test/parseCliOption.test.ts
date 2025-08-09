import assert from 'node:assert';
import { describe, test } from 'node:test';
import { parseCliOptions } from '../lib/cli-options.js';

describe('parseCliOptions', () => {
  test('should parse basic file arguments', () => {
    const result = parseCliOptions(['file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'elem',
        acceptJsonc: false,
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
        acceptJsonc: false,
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
        acceptJsonc: false,
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
      message: 'Invalid array diff algorithm: invalid. Must be one of \'elem\', \'lcs\', \'set\', or \'key\'.',
    });
  });

  test('should accept all valid array-diff algorithms', () => {
    const algorithms = ['elem', 'lcs', 'set'];

    algorithms.forEach(algorithm => {
      const result = parseCliOptions(['--array-diff', algorithm, 'file1.json', 'file2.json']);
      assert.strictEqual(result.main?.arrayDiff, algorithm);
      assert.strictEqual(result.main?.acceptJsonc, false);
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

  test('should prioritize help over jsonc option', () => {
    const result = parseCliOptions(['--help', '--jsonc', 'file1.jsonc', 'file2.jsonc']);

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

  test('should prioritize version over jsonc option but not help', () => {
    const result = parseCliOptions(['--version', '--jsonc', 'file1.jsonc', 'file2.jsonc']);

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
        acceptJsonc: false,
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
        acceptJsonc: false,
      },
    });
  });

  test('should parse jsonc option with long flag', () => {
    const result = parseCliOptions(['--jsonc', 'file1.jsonc', 'file2.jsonc']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.jsonc',
        file2: 'file2.jsonc',
        arrayDiff: 'elem',
        acceptJsonc: true,
      },
    });
  });

  test('should default acceptJsonc to false when not specified', () => {
    const result = parseCliOptions(['file1.json', 'file2.json']);

    assert.strictEqual(result.main?.acceptJsonc, false);
  });

  test('should handle jsonc option with other options', () => {
    const result = parseCliOptions(['--jsonc', '--array-diff', 'lcs', 'file1.jsonc', 'file2.jsonc']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.jsonc',
        file2: 'file2.jsonc',
        arrayDiff: 'lcs',
        acceptJsonc: true,
      },
    });
  });

  test('should handle jsonc option in different positions', () => {
    const result = parseCliOptions(['file1.jsonc', '--jsonc', 'file2.jsonc']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.jsonc',
        file2: 'file2.jsonc',
        arrayDiff: 'elem',
        acceptJsonc: true,
      },
    });
  });

  test('should parse color option', () => {
    const result = parseCliOptions(['--color', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'elem',
        acceptJsonc: false,
        color: true,
      },
    });
  });

  test('should parse no-color option', () => {
    const result = parseCliOptions(['--no-color', 'file1.json', 'file2.json']);

    assert.deepStrictEqual(result, {
      main: {
        file1: 'file1.json',
        file2: 'file2.json',
        arrayDiff: 'elem',
        acceptJsonc: false,
        color: false,
      },
    });
  });

  test('should throw error when both color and no-color are specified', () => {
    assert.throws(() => {
      parseCliOptions(['--color', '--no-color', 'file1.json', 'file2.json']);
    }, {
      name: 'TypeError',
      message: 'Cannot specify both --color and --no-color options',
    });
  });
});
