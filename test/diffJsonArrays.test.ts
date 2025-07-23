import { describe, test } from 'node:test';
import assert from 'node:assert';
import { diffJsonValues } from '../index.js';

describe('diffJsonArrays', () => {
  const leftArray = [1, 2, 3, 5, 8];
  const rightArray = [2, 3, 6, 7, 8];
  const rightArrayUnsorted = [8, 7, 2, 6, 3];

  test('should make a diff between two sorted arrays by lcs', () => {
    const result = diffJsonValues(leftArray, rightArray, [], { arrayDiffAlgorithm: 'lcs' });
    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].type, 'deleted');
    assert.deepStrictEqual(result[0].path, []);
    assert.deepStrictEqual(result[0].lhs, [1, 5]);
    assert.deepStrictEqual(result[0].rhs, undefined);

    assert.strictEqual(result[1].type, 'added');
    assert.deepStrictEqual(result[1].path, []);
    assert.deepStrictEqual(result[1].lhs, undefined);
    assert.deepStrictEqual(result[1].rhs, [6, 7]);
  });

  test('should make a diff between a sorted array and an unsorted array by lcs', () => {
    const result = diffJsonValues(leftArray, rightArrayUnsorted, [], { arrayDiffAlgorithm: 'lcs' });
    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].type, 'deleted');
    assert.deepStrictEqual(result[0].path, []);
    assert.deepStrictEqual(result[0].lhs, [1, 5, 8]);
    assert.deepStrictEqual(result[0].rhs, undefined);

    assert.strictEqual(result[1].type, 'added');
    assert.deepStrictEqual(result[1].path, []);
    assert.deepStrictEqual(result[1].lhs, undefined);
    assert.deepStrictEqual(result[1].rhs, [8, 7, 6]);
  });

  test('should make a diff between two sorted arrays by set', () => {
    const result = diffJsonValues(leftArray, rightArray, [], { arrayDiffAlgorithm: 'set' });
    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].type, 'deleted');
    assert.deepStrictEqual(result[0].path, []);
    assertIsArrayAndContainsAll(result[0].lhs, [1, 5]);
    assert.deepStrictEqual(result[0].rhs, undefined);

    assert.strictEqual(result[1].type, 'added');
    assert.deepStrictEqual(result[1].path, []);
    assert.deepStrictEqual(result[1].lhs, undefined);
    assertIsArrayAndContainsAll(result[1].rhs, [6, 7]);
  });

  test('should make a diff between a sorted array and an unsorted array by set', () => {
    const result = diffJsonValues(leftArray, rightArrayUnsorted, [], { arrayDiffAlgorithm: 'set' });
    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].type, 'deleted');
    assert.deepStrictEqual(result[0].path, []);
    assertIsArrayAndContainsAll(result[0].lhs, [1, 5]);
    assert.deepStrictEqual(result[0].rhs, undefined);

    assert.strictEqual(result[1].type, 'added');
    assert.deepStrictEqual(result[1].path, []);
    assert.deepStrictEqual(result[1].lhs, undefined);
    assertIsArrayAndContainsAll(result[1].rhs, [7, 6]);
  });
});

/**
 * Assert that the actual value is an array and contains all expected values.
 * The order of elements in the actual and expected arrays does not matter.
 */
function assertIsArrayAndContainsAll(actual: unknown, expected: unknown[]) {
  if (!Array.isArray(actual)) {
    assert.fail(`Expected an array but got ${typeof actual}`);
  }
  assert.strictEqual(actual.length, expected.length, `Expected array length to be ${expected.length} but got ${actual.length}`);

  for (const value of expected) {
    assert(actual.includes(value), `Expected array to contain ${value} but it does not`);
  }
}
