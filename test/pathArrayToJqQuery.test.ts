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

  test('should format array index with mixed elements', () => {
    const result = pathArrayToJqQuery([0, 'name', 1, 'value']);
    assert.strictEqual(result, '.[0].name[1].value');
  });

  test('should format key-based selection', () => {
    const result = pathArrayToJqQuery(['users', { type: 'keySelect', keyField: 'id', keyValue: 3 }]);
    assert.strictEqual(result, '.users[] | select(.id == 3)');
  });

  test('should format key-based selection with field access', () => {
    const result = pathArrayToJqQuery(['users', { type: 'keySelect', keyField: 'id', keyValue: 2 }, 'name']);
    assert.strictEqual(result, '.users[] | select(.id == 2) | .name');
  });

  test('should format key-based selection with nested field access', () => {
    const result = pathArrayToJqQuery(['products', { type: 'keySelect', keyField: 'sku', keyValue: 'LAPTOP-001' }, 'details', 'specs']);
    assert.strictEqual(result, '.products[] | select(.sku == "LAPTOP-001") | .details.specs');
  });

  test('should format key-based selection with string key containing special characters', () => {
    const result = pathArrayToJqQuery(['items', { type: 'keySelect', keyField: 'key.name', keyValue: 'test[0]' }]);
    assert.strictEqual(result, '.items[] | select(.key.name == "test[0]")');
  });
});
