import assert from 'node:assert';
import { describe, test } from 'node:test';
import { pathArrayToJqQuery } from '../lib/jq-query.js';

describe('toPathJqQuery', () => {
  test('should return "." for empty path', () => {
    const result = pathArrayToJqQuery([]);
    assert.strictEqual(result, '.');
  });

  test('should handle simple property paths', () => {
    const result = pathArrayToJqQuery(['name']);
    assert.strictEqual(result, '.name');
  });

  test('should handle nested property paths', () => {
    const result = pathArrayToJqQuery(['user', 'name']);
    assert.strictEqual(result, '.user.name');
  });

  test('should handle array indices', () => {
    const result = pathArrayToJqQuery(['items', 0]);
    assert.strictEqual(result, '.items[0]');
  });

  test('should handle complex nested paths', () => {
    const result = pathArrayToJqQuery(['users', 0, 'address', 'city']);
    assert.strictEqual(result, '.users[0].address.city');
  });

  test('should quote properties with special characters', () => {
    const result = pathArrayToJqQuery(['user.name']);
    assert.strictEqual(result, '."user.name"');
  });

  test('should quote properties with brackets', () => {
    const result = pathArrayToJqQuery(['user[0]']);
    assert.strictEqual(result, '."user[0]"');
  });

  test('should handle root array access', () => {
    const result = pathArrayToJqQuery([0]);
    assert.strictEqual(result, '.[0]');
  });

  test('should handle multiple array indices', () => {
    const result = pathArrayToJqQuery([0, 1, 2]);
    assert.strictEqual(result, '.[0][1][2]');
  });

  test('should handle mixed array and object access', () => {
    const result = pathArrayToJqQuery([0, 'name', 1, 'value']);
    assert.strictEqual(result, '.[0].name[1].value');
  });
});
