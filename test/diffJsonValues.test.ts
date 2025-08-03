import assert from 'node:assert';
import { describe, test } from 'node:test';
import { diffJsonValues } from '../lib/diff.js';

describe('diffJsonValues', () => {
  test('should return empty array for identical values', () => {
    const result = diffJsonValues('same', 'same');
    assert.strictEqual(result.length, 0);
  });

  test('should return empty array for identical null values', () => {
    const result = diffJsonValues(null, null);
    assert.strictEqual(result.length, 0);
  });

  test('should detect primitive value changes', () => {
    const result = diffJsonValues('old', 'new');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.strictEqual(result[0].lhs, 'old');
    assert.strictEqual(result[0].rhs, 'new');
    assert.deepStrictEqual(result[0].path, []);
  });

  test('should detect null to value change', () => {
    const result = diffJsonValues(null, 'new');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'added');
    assert.strictEqual(result[0].lhs, null);
    assert.strictEqual(result[0].rhs, 'new');
  });

  test('should detect value to null change', () => {
    const result = diffJsonValues('old', null);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'deleted');
    assert.strictEqual(result[0].lhs, 'old');
    assert.strictEqual(result[0].rhs, null);
  });

  test('should detect type changes', () => {
    const result = diffJsonValues(42, 'string');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.strictEqual(result[0].lhs, 42);
    assert.strictEqual(result[0].rhs, 'string');
  });

  test('should detect object property changes', () => {
    const left = { name: 'John', age: 30 };
    const right = { name: 'John', age: 31 };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.deepStrictEqual(result[0].path, ['age']);
    assert.strictEqual(result[0].lhs, 30);
    assert.strictEqual(result[0].rhs, 31);
  });

  test('should detect added object properties', () => {
    const left = { name: 'John' };
    const right = { name: 'John', age: 30 };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'added');
    assert.deepStrictEqual(result[0].path, ['age']);
    assert.strictEqual(result[0].lhs, undefined);
    assert.strictEqual(result[0].rhs, 30);
  });

  test('should detect deleted object properties', () => {
    const left = { name: 'John', age: 30 };
    const right = { name: 'John' };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'deleted');
    assert.deepStrictEqual(result[0].path, ['age']);
    assert.strictEqual(result[0].lhs, 30);
    assert.strictEqual(result[0].rhs, undefined);
  });

  test('should detect array length changes', () => {
    const left = [1, 2, 3];
    const right = [1, 2];
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.deepStrictEqual(result[0].path, []);
    assert.deepStrictEqual(result[0].lhs, [1, 2, 3]);
    assert.deepStrictEqual(result[0].rhs, [1, 2]);
  });

  test('should detect array element changes', () => {
    const left = [1, 2, 3];
    const right = [1, 5, 3];
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.deepStrictEqual(result[0].path, [1]);
    assert.strictEqual(result[0].lhs, 2);
    assert.strictEqual(result[0].rhs, 5);
  });

  test('should detect nested object changes', () => {
    const left = { user: { name: 'John', age: 30 }};
    const right = { user: { name: 'Jane', age: 30 }};
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'modified');
    assert.deepStrictEqual(result[0].path, ['user', 'name']);
    assert.strictEqual(result[0].lhs, 'John');
    assert.strictEqual(result[0].rhs, 'Jane');
  });

  test('should ignore fields that have undefined values', () => {
    const left = { name: 'John', age: undefined };
    const right = { name: 'John', age: 30 };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'added');  // not 'modified' because age was undefined in left
    assert.deepStrictEqual(result[0].path, ['age']);
    assert.strictEqual(result[0].lhs, undefined);
    assert.strictEqual(result[0].rhs, 30);
  });

  test('should treat undefined as missing property in both directions', () => {
    const left = { name: 'John', age: 30 };
    const right = { name: 'John', age: undefined };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'deleted');  // age was removed (became undefined)
    assert.deepStrictEqual(result[0].path, ['age']);
    assert.strictEqual(result[0].lhs, 30);
    assert.strictEqual(result[0].rhs, undefined);
  });

  test('should ignore both sides when both have undefined values', () => {
    const left = { name: 'John', age: undefined };
    const right = { name: 'John', age: undefined };
    const result = diffJsonValues(left, right);

    assert.strictEqual(result.length, 0);  // no difference since both are undefined
  });
});
