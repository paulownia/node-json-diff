import assert from 'node:assert';
import { describe, test } from 'node:test';
import { toPathJqQuery } from '../lib/path-utils.js';

describe('toPathJqQuery', () => {
  test('should return "." for empty path', () => {
    const result = toPathJqQuery([]);
    assert.strictEqual(result, '.');
  });

  test('should handle simple property paths', () => {
    const result = toPathJqQuery(['name']);
    assert.strictEqual(result, '.name');
  });

  test('should handle nested property paths', () => {
    const result = toPathJqQuery(['user', 'name']);
    assert.strictEqual(result, '.user.name');
  });

  test('should handle array indices', () => {
    const result = toPathJqQuery(['items', 0]);
    assert.strictEqual(result, '.items[0]');
  });

  test('should handle complex nested paths', () => {
    const result = toPathJqQuery(['users', 0, 'address', 'city']);
    assert.strictEqual(result, '.users[0].address.city');
  });

  test('should quote properties with special characters', () => {
    const result = toPathJqQuery(['user.name']);
    assert.strictEqual(result, '."user.name"');
  });

  test('should quote properties with brackets', () => {
    const result = toPathJqQuery(['user[0]']);
    assert.strictEqual(result, '."user[0]"');
  });

  test('should handle root array access', () => {
    const result = toPathJqQuery([0]);
    assert.strictEqual(result, '.[0]');
  });

  test('should handle multiple array indices', () => {
    const result = toPathJqQuery([0, 1, 2]);
    assert.strictEqual(result, '.[0][1][2]');
  });

  test('should handle mixed array and object access', () => {
    const result = toPathJqQuery([0, 'name', 1, 'value']);
    assert.strictEqual(result, '.[0].name[1].value');
  });
});
