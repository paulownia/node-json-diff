// JSON diff logic

export type DiffItem = {
  path: (string | number)[];
  lhs: any;
  rhs: any;
  type: string;
};

/**
 * Create a diff between two JSON values
 */
export function diffJsonValues(
  left: any,
  right: any,
  pathArray: (string | number)[] = [],
): DiffItem[] {
  // Exclude the case where both are null
  if (left === null && right === null) {
    return []; // no difference
  }

  // When one is null, or types are different
  if (left === null || right === null || typeof left !== typeof right) {
    const changeType = left === null ? 'added' : right === null ? 'deleted' : 'modified';
    return [{
      path: pathArray,
      lhs: left,
      rhs: right,
      type: changeType,
    }];
  }

  // When both are primitive values
  if (typeof left !== 'object' && typeof right !== 'object') {
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

  // At this point, both are guaranteed to be objects or arrays

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
  left: any[],
  right: any[],
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
    const elementDiffs = diffJsonValues(left[i], right[i], [...pathArray, i]);
    diffs.push(...elementDiffs);
  }

  return diffs;
}

/**
 * Create a diff between two JSON Objects
 */
function diffJsonObjects(
  left: Record<string, any>,
  right: Record<string, any>,
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
        lhs: left[key],
        rhs: undefined,
        type: 'deleted',
      });
    } else {
      // the key exists in both objects, compare them as json values
      const elementDiffs = diffJsonValues(left[key], right[key], [...pathArray, key]);
      diffs.push(...elementDiffs);
    }
  }

  for (const key of rightKeys) {
    // the key exists only in right
    if (!Object.prototype.hasOwnProperty.call(left, key)) {
      diffs.push({
        path: [...pathArray, key],
        lhs: undefined,
        rhs: right[key],
        type: 'added',
      });
    }
  }
  return diffs;
}
