// JSON diff logic
import { JsonValue, DiffItem, isJsonPrimitive, JsonObject , JsonArray } from './types.js';
/**
 * Create a diff between two JSON values
 */
export function diffJsonValues(
  left: JsonValue,
  right: JsonValue,
  pathArray: (string | number)[] = [],
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
    return diffJsonArrays(left, right, pathArray);
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
  return diffJsonObjects(left, right, pathArray);
}

/**
 * Create a diff between two JSON Arrays
 */
function diffJsonArrays(
  left: JsonArray,
  right: JsonArray,
  pathArray: (string | number)[],
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
    const elementDiffs = diffJsonValues(leftItem, rightItem, [...pathArray, i]);
    diffs.push(...elementDiffs);
  }

  return diffs;
}

/**
 * Create a diff between two JSON Objects
 */
function diffJsonObjects(
  left: JsonObject,
  right: JsonObject,
  pathArray: (string | number)[],
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
      // the key exists in both objects, compare them as json values
      const elementDiffs = diffJsonValues(left[key] as JsonValue, right[key] as JsonValue, [...pathArray, key]);
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
