// JSON diff logic
import { JsonValue, DiffItem, isJsonPrimitive, JsonObject , JsonArray, DiffOptions } from './types.js';
import fastArrayDiff from 'fast-array-diff';
import deepEqual from 'deep-equal';
/**
 * Create a diff between two JSON values
 */
export function diffJsonValues(
  left: JsonValue,
  right: JsonValue,
  pathArray: (string | number)[] = [],
  options: DiffOptions = { arrayDiffAlgorithm: 'elem' },
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
  pathArray: (string | number)[],
  options: DiffOptions = { arrayDiffAlgorithm: 'elem' },
): DiffItem[] {
  if (left.length === 0 && right.length === 0) {
    return []; // no difference
  }

  if (options.arrayDiffAlgorithm === 'lcs') {
    return diffJsonArrayByMyers(left, right, pathArray);
  }

  if (options.arrayDiffAlgorithm === 'set') {
    return diffJsonArraysIgnoringOrder(left, right, pathArray);
  }

  return diffJsonArraysBasic(left, right, pathArray, options);
}

/**
 * Create a diff between two JSON Objects
 */
function diffJsonObjects(
  left: JsonObject,
  right: JsonObject,
  pathArray: (string | number)[],
  options: DiffOptions = { arrayDiffAlgorithm: 'elem' },
): DiffItem[] {
  // Compare object keys
  const diffs: DiffItem[] = [];
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  // compare keys in both objects
  for (const key of leftKeys) {
    if (!Object.prototype.hasOwnProperty.call(right, key)) {
      // the key exists only in left
      diffs.push({
        path: [...pathArray, key],
        lhs: left[key] as JsonValue,
        rhs: undefined,
        type: 'deleted',
      });
    } else {
      const leftValue = left[key] as JsonValue;
      const rightValue = right[key] as JsonValue;
      // the key exists in both objects, compare them as json values
      const elementDiffs = diffJsonValues(leftValue, rightValue, [...pathArray, key], options);
      diffs.push(...elementDiffs);
    }
  }

  for (const key of rightKeys) {
    // the key exists only in right
    if (!Object.prototype.hasOwnProperty.call(left, key)) {
      diffs.push({
        path: [...pathArray, key],
        lhs: undefined,
        rhs: right[key] as JsonValue,
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
  pathArray: (string | number)[],
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
  pathArray: (string | number)[] = [],
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
  pathArray: (string | number)[] = [],
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
