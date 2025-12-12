// JSON diff logic
import deepEqual from 'deep-equal';
import * as fastArrayDiff from 'fast-array-diff';
import { DiffItem, DiffOptions, isJsonPrimitive, JsonArray, JsonObject, JsonValue, PathElement } from './types.js';
/**
 * Create a diff between two JSON values
 */
export function diffJsonValues(
  left: JsonValue,
  right: JsonValue,
  pathArray: PathElement[] = [],
  options: DiffOptions = {},
): DiffItem[] {
  // Exclude the case where both are null
  if (left === null && right === null) {
    return []; // no difference
  }

  // When one is null
  if (left === null || right === null) {
    const changeType = left === null ? 'added' : 'deleted';
    return [{
      path: pathArray,
      lhs: left,
      rhs: right,
      type: changeType,
    }];
  }

  // When both are primitive values
  if (isJsonPrimitive(left) && isJsonPrimitive(right)) {
    if (left !== right) {
      return [{
        path: pathArray,
        lhs: left,
        rhs: right,
        type: 'modified',
      }];
    }
    return []; // no difference
  }

  if (isJsonPrimitive(left) || isJsonPrimitive(right)) {
    return [{
      path: pathArray,
      lhs: left,
      rhs: right,
      type: 'modified',
    }];
  }

  // if both are arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    return diffJsonArrays(left, right, pathArray, options);
  }

  // if both are not arrays, but one is an array
  if (Array.isArray(left) || Array.isArray(right)) {
    return [{
      path: pathArray,
      lhs: left,
      rhs: right,
      type: 'modified',
    }];
  }

  // At this point, both are guaranteed to be objects
  return diffJsonObjects(left, right, pathArray, options);
}

/**
 * Create a diff between two JSON Arrays
 */
function diffJsonArrays(
  left: JsonArray,
  right: JsonArray,
  pathArray: PathElement[],
  options: DiffOptions = {},
): DiffItem[] {
  if (left.length === 0 && right.length === 0) {
    return []; // no difference
  }

  switch (options.arrayDiffAlgorithm) {
    case 'lcs':
      return diffJsonArrayByMyers(left, right, pathArray);
    case 'set':
      return diffJsonArraysIgnoringOrder(left, right, pathArray);
    case 'key':
      return diffJsonArraysByKey(left, right, pathArray, options.arrayKey || 'id', options);
    default:  // 'elem' or any other value, including undefined
      return diffJsonArraysBasic(left, right, pathArray, options);
  }
}

/**
 * Create a diff between two JSON Objects
 */
function diffJsonObjects(
  left: JsonObject,
  right: JsonObject,
  pathArray: PathElement[],
  options: DiffOptions = {},
): DiffItem[] {
  // Compare object keys, filtering out undefined values (JSON doesn't have undefined)
  const diffs: DiffItem[] = [];

  // Get keys that have defined values (not undefined)
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  // compare keys in both objects
  for (const key of leftKeys) {
    const leftValue = left[key] as JsonValue | undefined;
    if (leftValue === undefined) continue;

    const rightValue = right[key] as JsonValue | undefined;
    if (rightValue === undefined || !Object.prototype.hasOwnProperty.call(right, key)) {
      // the key exists only in left (right has undefined or missing)
      diffs.push({
        path: [...pathArray, key],
        lhs: leftValue,
        rhs: undefined,
        type: 'deleted',
      });
    } else {
      // the key exists in both objects with defined values, compare them as json values
      const elementDiffs = diffJsonValues(leftValue, rightValue, [...pathArray, key], options);
      diffs.push(...elementDiffs);
    }
  }

  for (const key of rightKeys) {
    const rightValue = right[key] as JsonValue | undefined;
    if (rightValue === undefined) continue;

    const leftValue = left[key] as JsonValue | undefined;
    // the key exists only in right (left has undefined or missing)
    if (leftValue === undefined || !Object.prototype.hasOwnProperty.call(left, key)) {
      diffs.push({
        path: [...pathArray, key],
        lhs: undefined,
        rhs: rightValue,
        type: 'added',
      });
    }
  }
  return diffs;
}

/**
 * Create a diff between two JSON Arrays.
 *
 * This is useful when:
 * - Each element of the arrays is a object.
 * - The length of the two arrays is guaranteed to be the same.
 * - The arrays are already sorted.
 * This way provides detailed differences for each element.
 */
function diffJsonArraysBasic(
  left: JsonArray,
  right: JsonArray,
  pathArray: PathElement[],
  options: DiffOptions = { arrayDiffAlgorithm: 'elem' },
): DiffItem[] {
  // compare length, if they are different, not compare each element
  if (left.length !== right.length) {
    return [{
      path: pathArray,
      lhs: left,
      rhs: right,
      type: 'modified',
    }];
  }

  // compare each element
  const diffs: DiffItem[] = [];
  for (let i = 0; i < left.length; i++) {
    const leftItem = left[i] as JsonValue;
    const rightItem = right[i] as JsonValue;
    const elementDiffs = diffJsonValues(leftItem, rightItem, [...pathArray, i], options);
    diffs.push(...elementDiffs);
  }

  return diffs;
}

/**
 * Make a diff between two JSON arrays using Myers algorithm.
 *
 * This is the most standard way. But for object arrays, you will not get detailed differences.
 */
function diffJsonArrayByMyers(
  left: unknown[],
  right: unknown[],
  pathArray: PathElement[] = [],
): DiffItem[] {
  const faDiff = fastArrayDiff.diff(left, right, (left, right) => deepEqual(left, right));
  // copy pathArray to avoid mutation
  const path = [...pathArray];

  const diffs: DiffItem[] = [];
  if (faDiff.removed.length > 0) {
    diffs.push({
      type: 'deleted',
      lhs: [...faDiff.removed],
      rhs: undefined,
      path,
    });
  }
  if (faDiff.added.length > 0) {
    diffs.push({
      type: 'added',
      lhs: undefined,
      rhs: [...faDiff.added],
      path,
    });
  }
  return diffs;
}

/**
 * Make a diff between two JSON arrays ignoring the order of elements.
 *
 * This is useful when the order of elements in arrays does not matter.
 * Two JSON arrays are treated like sets, and the symmetric difference is calculated as the diff.
 * For object arrays, this way does not provide detailed differences.
 */
function diffJsonArraysIgnoringOrder(
  left: unknown[],
  right: unknown[],
  pathArray: PathElement[] = [],
): DiffItem[] {
  // If both arrays are empty, return no diff
  if (left.length === 0 && right.length === 0) {
    return [];
  }
  // elements exist only in left
  const leftOnly = [];
  const rightOnly = [];
  const intersectedRightIndex = new Set<number>();

  out: for (let l = 0; l < left.length; l++) {
    for (let r = 0; r < right.length; r++) {
      if (deepEqual(left[l], right[r])) {
        // lItem exists in right, so skip it
        intersectedRightIndex.add(r);
        continue out;
      }
    }
    leftOnly.push(left[l]);
  }

  // elements exist only in right
  for (let r = 0; r < right.length; r++) {
    if (intersectedRightIndex.has(r)) {
      continue;  // we already found this item in left
    }
    for (let l = 0; l < left.length; l++) {
      if (deepEqual(right[r], left[l])) {
        continue; // this item exists in left, so skip it
      }
    }
    rightOnly.push(right[r]);
  }

  const diffs: DiffItem[] = [];
  if (leftOnly.length > 0) {
    diffs.push({
      type: 'deleted',
      lhs: leftOnly,
      rhs: undefined,
      path: pathArray,
    });
  }
  if (rightOnly.length > 0) {
    diffs.push({
      type: 'added',
      lhs: undefined,
      rhs: rightOnly,
      path: pathArray,
    });
  }
  return diffs;
}

/**
 * Make a diff between two JSON arrays using key-based comparison.
 *
 * This is useful for arrays of objects where each object has a unique identifier field.
 * Objects are matched by their key field value, and order is ignored.
 * Provides detailed object-level differences for matched objects.
 * Objects without the specified key field are compared using set comparison as fallback.
 */
function diffJsonArraysByKey(
  left: unknown[],
  right: unknown[],
  pathArray: PathElement[],
  keyField: string,
  options: DiffOptions,
): DiffItem[] {
  // Separate objects with and without the key field
  const leftWithKey: unknown[] = [];
  const leftWithoutKey: unknown[] = [];
  const rightWithKey: unknown[] = [];
  const rightWithoutKey: unknown[] = [];

  // Create maps for key-based lookup (ignoring order)
  const leftMap = new Map<unknown, unknown>();
  const rightMap = new Map<unknown, unknown>();

  // Build left map and separate objects
  left.forEach(item => {
    if (typeof item === 'object' && item !== null && keyField in item) {
      const keyValue = (item as Record<string, unknown>)[keyField];
      // Treat undefined as missing key (JSON doesn't have undefined)
      if (keyValue !== undefined) {
        leftMap.set(keyValue, item);
        leftWithKey.push(item);
      } else {
        leftWithoutKey.push(item);
      }
    } else {
      leftWithoutKey.push(item);
    }
  });

  // Build right map and separate objects
  right.forEach(item => {
    if (typeof item === 'object' && item !== null && keyField in item) {
      const keyValue = (item as Record<string, unknown>)[keyField];
      // Treat undefined as missing key (JSON doesn't have undefined)
      if (keyValue !== undefined) {
        rightMap.set(keyValue, item);
        rightWithKey.push(item);
      } else {
        rightWithoutKey.push(item);
      }
    } else {
      rightWithoutKey.push(item);
    }
  });

  const diffs: DiffItem[] = [];

  // Compare objects with key field using key-based comparison
  // Find deleted items (exist in left but not in right)
  for (const [key, value] of leftMap) {
    if (!rightMap.has(key)) {
      diffs.push({
        type: 'deleted',
        lhs: value as JsonValue,
        rhs: undefined,
        path: [...pathArray, { type: 'keySelect', keyField, keyValue: key }],
      });
    }
  }

  // Find added and modified items
  for (const [key, rightValue] of rightMap) {
    if (!leftMap.has(key)) {
      // New item added
      diffs.push({
        type: 'added',
        lhs: undefined,
        rhs: rightValue as JsonValue,
        path: [...pathArray, { type: 'keySelect', keyField, keyValue: key }],
      });
    } else {
      // Item exists in both, compare detailed differences
      const leftValue = leftMap.get(key);
      const itemDiffs = diffJsonValues(
        leftValue as JsonValue,
        rightValue as JsonValue,
        [...pathArray, { type: 'keySelect', keyField, keyValue: key }],
        options,
      );
      diffs.push(...itemDiffs);
    }
  }

  // Compare objects without key field using set comparison as fallback
  if (leftWithoutKey.length > 0 || rightWithoutKey.length > 0) {
    const fallbackDiffs = diffJsonArraysIgnoringOrder(leftWithoutKey, rightWithoutKey, pathArray);
    diffs.push(...fallbackDiffs);
  }

  return diffs;
}
