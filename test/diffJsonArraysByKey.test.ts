import assert from 'node:assert';
import { describe, it } from 'node:test';
import { diffJsonValues } from '../lib/diff.js';
import { DiffOptions } from '../lib/types.js';

describe('diffJsonArraysByKey', () => {
  const options: DiffOptions = { arrayDiffAlgorithm: 'key', arrayKey: 'id' };

  describe('Arrays with all objects having key field', () => {
    it('should find no differences when arrays are identical', () => {
      const left = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const right = [
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' },
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, []);
    });

    it('should detect added objects', () => {
      const left = [
        { id: 1, name: 'Alice' },
      ];
      const right = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, [
        {
          type: 'added',
          lhs: undefined,
          rhs: { id: 2, name: 'Bob' },
          path: [{ type: 'keySelect', keyField: 'id', keyValue: 2 }],
        },
      ]);
    });

    it('should detect deleted objects', () => {
      const left = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const right = [
        { id: 1, name: 'Alice' },
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, [
        {
          type: 'deleted',
          lhs: { id: 2, name: 'Bob' },
          rhs: undefined,
          path: [{ type: 'keySelect', keyField: 'id', keyValue: 2 }],
        },
      ]);
    });

    it('should detect modified objects', () => {
      const left = [
        { id: 1, name: 'Alice', age: 25 },
      ];
      const right = [
        { id: 1, name: 'Alice', age: 26 },
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, [
        {
          type: 'modified',
          lhs: 25,
          rhs: 26,
          path: [{ type: 'keySelect', keyField: 'id', keyValue: 1 }, 'age'],
        },
      ]);
    });

    it('should handle complex nested modifications', () => {
      const left = [
        { id: 1, profile: { name: 'Alice', settings: { theme: 'dark' }}},
      ];
      const right = [
        { id: 1, profile: { name: 'Alice', settings: { theme: 'light' }}},
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, [
        {
          type: 'modified',
          lhs: 'dark',
          rhs: 'light',
          path: [{ type: 'keySelect', keyField: 'id', keyValue: 1 }, 'profile', 'settings', 'theme'],
        },
      ]);
    });
  });

  describe('Arrays with mixed objects (with and without key field)', () => {
    it('should compare objects with key using key-based comparison and objects without key using set comparison', () => {
      const left = [
        { id: 1, name: 'Alice' },
        { name: 'NoId1', value: 100 },
        { id: 2, name: 'Bob' },
      ];
      const right = [
        { id: 1, name: 'Alice Updated' },
        { name: 'NoId2', value: 200 },
        { id: 2, name: 'Bob' },
      ];

      const result = diffJsonValues(left, right, [], options);

      assert.equal(result.length, 3);

      // Should detect modification in object with id=1
      assert.deepStrictEqual(result[0], {
        type: 'modified',
        lhs: 'Alice',
        rhs: 'Alice Updated',
        path: [{ type: 'keySelect', keyField: 'id', keyValue: 1 }, 'name'],
      });

      assert.deepStrictEqual(result[1], {
        type: 'deleted',
        lhs: [{ name: 'NoId1', value: 100 }],
        rhs: undefined,
        path: [],
      });

      assert.deepStrictEqual(result[2], {
        type: 'added',
        lhs: undefined,
        rhs: [{ name: 'NoId2', value: 200 }],
        path: [],
      });
    });
  });

  describe('Arrays with no objects having key field', () => {
    it('should fall back to set comparison for objects without key field', () => {
      const left = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];
      const right = [
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 },
      ];
      const result = diffJsonValues(left, right, [], options);

      // Should use set comparison fallback
      assert.strictEqual(result.length, 2);
      // One deleted, one added
      assert(result.some(diff => diff.type === 'deleted'));
      assert(result.some(diff => diff.type === 'added'));
    });

    it('should handle identical arrays without key field', () => {
      const left = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];
      const right = [
        { name: 'Bob', age: 30 },
        { name: 'Alice', age: 25 },
      ];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('Primitive arrays', () => {
    it('should fall back to set comparison for primitive arrays', () => {
      const left = [1, 2, 3];
      const right = [2, 3, 4];
      const result = diffJsonValues(left, right, [], options);

      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result, [
        {
          type: 'deleted',
          lhs: [1],
          rhs: undefined,
          path: [],
        },
        {
          type: 'added',
          lhs: undefined,
          rhs: [4],
          path: [],
        },
      ]);
    });

    it('should handle identical primitive arrays', () => {
      const left = [1, 2, 3];
      const right = [3, 1, 2];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, []);
    });

    it('should handle string arrays', () => {
      const left = ['apple', 'banana'];
      const right = ['banana', 'cherry'];
      const result = diffJsonValues(left, right, [], options);

      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result, [
        {
          type: 'deleted',
          lhs: ['apple'],
          rhs: undefined,
          path: [],
        },
        {
          type: 'added',
          lhs: undefined,
          rhs: ['cherry'],
          path: [],
        },
      ]);
    });
  });

  describe('Custom key field', () => {
    it('should use custom key field for comparison', () => {
      const customOptions: DiffOptions = { arrayDiffAlgorithm: 'key', arrayKey: 'uuid' };

      const left = [
        { uuid: 'a1', name: 'Alice' },
        { uuid: 'b2', name: 'Bob' },
      ];
      const right = [
        { uuid: 'a1', name: 'Alice Updated' },
        { uuid: 'c3', name: 'Charlie' },
      ];
      const result = diffJsonValues(left, right, [], customOptions);

      assert.equal(result.length, 3);
      assert.deepStrictEqual(result[0], {
        type: 'deleted',
        lhs: { uuid: 'b2', name: 'Bob' },
        rhs: undefined,
        path: [{ type: 'keySelect', keyField: 'uuid', keyValue: 'b2' }],
      }, 'b2の要素が削除された');

      assert.deepStrictEqual(result[1], {
        type: 'modified',
        lhs: 'Alice',
        rhs: 'Alice Updated',
        path: [{ type: 'keySelect', keyField: 'uuid', keyValue: 'a1' }, 'name'],
      }, 'a1の要素が修正された');

      assert.deepStrictEqual(result[2], {
        type: 'added',
        lhs: undefined,
        rhs: { uuid: 'c3', name: 'Charlie' },
        path: [{ type: 'keySelect', keyField: 'uuid', keyValue: 'c3' }],
      }, 'c3の要素が追加された');
    });

    it('should handle objects without custom key field', () => {
      const customOptions: DiffOptions = { arrayDiffAlgorithm: 'key', arrayKey: 'customId' };

      const left = [
        { customId: 1, name: 'Alice' },
        { name: 'Bob' }, // No customId
      ];
      const right = [
        { customId: 1, name: 'Alice' },
        { name: 'Charlie' }, // No customId
      ];
      const result = diffJsonValues(left, right, [], customOptions);

      // Should use set comparison for objects without customId
      assert.strictEqual(result.length, 2);
      assert(result.some(diff => diff.type === 'deleted'));
      assert(result.some(diff => diff.type === 'added'));
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays', () => {
      const left: unknown[] = [];
      const right: unknown[] = [];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, []);
    });

    it('should handle one empty array', () => {
      const left: unknown[] = [];
      const right = [{ id: 1, name: 'Alice' }];
      const result = diffJsonValues(left, right, [], options);
      assert.deepStrictEqual(result, [
        {
          type: 'added',
          lhs: undefined,
          rhs: { id: 1, name: 'Alice' },
          path: [{ type: 'keySelect', keyField: 'id', keyValue: 1 }],
        },
      ]);
    });

    it('should handle null values in key field', () => {
      const left = [
        { id: null, name: 'Alice' },
      ];
      const right = [
        { id: null, name: 'Alice Updated' },
      ];
      const result = diffJsonValues(left, right, [], options);

      // Objects with null id should be treated as having keys
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].type, 'modified');
      assert.strictEqual(result[0].lhs, 'Alice');
      assert.strictEqual(result[0].rhs, 'Alice Updated');
    });

    it('should handle undefined values in key field as missing key', () => {
      const left = [
        { id: 1, name: 'Alice' },
        { id: undefined, name: 'Bob' }, // undefinedは存在しないキーとして扱う
      ];
      const right = [
        { id: 1, name: 'Alice Updated' },
        { name: 'Charlie' }, // キーなしのオブジェクト
      ];
      const result = diffJsonValues(left, right, [], options);

      // id=1のオブジェクトは修正、キーなしのオブジェクトはset比較
      assert.strictEqual(result.length, 3);

      // id=1の修正
      assert.deepStrictEqual(result[0], {
        type: 'modified',
        lhs: 'Alice',
        rhs: 'Alice Updated',
        path: [{ type: 'keySelect', keyField: 'id', keyValue: 1 }, 'name'],
      });

      // キーなしオブジェクトの削除と追加
      assert(result.some(diff => diff.type === 'deleted'));
      assert(result.some(diff => diff.type === 'added'));
    });

    it('should handle duplicate key values', () => {
      const left = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Alice Duplicate' },
      ];
      const right = [
        { id: 1, name: 'Alice Updated' },
      ];
      const result = diffJsonValues(left, right, [], options);

      // Should handle duplicate keys (last one wins in Map)
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].type, 'modified');
    });

    it('should handle nested path correctly', () => {
      const left = [{ id: 1, name: 'Alice' }];
      const right = [{ id: 1, name: 'Bob' }];
      const result = diffJsonValues(left, right, ['users'], options);

      assert.deepStrictEqual(result, [
        {
          type: 'modified',
          lhs: 'Alice',
          rhs: 'Bob',
          path: ['users', { type: 'keySelect', keyField: 'id', keyValue: 1 }, 'name'],
        },
      ]);
    });
  });
});
