import fs from 'fs';
import path from 'path';

/**
 * Create a diff between two JSON values
 */
export function diffJsonValues(left, right, pathArray = []) {
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
function diffJsonArrays(left, right, pathArray) {
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
  const diffs = [];
  for (let i = 0; i < left.length; i++) {
    const elementDiffs = diffJsonValues(left[i], right[i], [...pathArray, i]);
    diffs.push(...elementDiffs);
  }

  return diffs;
}

/**
 * Create a diff between two JSON Objects
 */
function diffJsonObjects(left, right, pathArray) {
  // Compare object keys
  const diffs = [];
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  // compare keys in both objects
  for (const key of leftKeys) {
    if (!right.hasOwnProperty(key)) {
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
    if (!left.hasOwnProperty(key)) {
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

/**
 * Convert a path array to a jq query string
 */
export function toPathJqQuery(pathArray) {
  // ["a", "b", "c"] -> .a.b.c
  // ["a", 0, "c"] -> .a[0].c
  // [""]  // -> .
  // [0]   // -> [0]
  if (pathArray.length === 0) return '.';

  return pathArray.map((p) => {
    if (typeof p === 'number') {
      return `[${p}]`;
    }

    if (p.includes('.') || p.includes('[') || p.includes(']')) {
      return `."${p}"`;
    } else {
      return `.${p}`;
    }
  }).join('');
}

/**
 * Compare two JSON files and output the differences
 * @param {string} file1 - Path to the first JSON file
 * @param {string} file2 - Path to the second JSON file
 */
export function diffJsonFiles(file1, file2) {
  try {
    const json1 = JSON.parse(fs.readFileSync(path.resolve(file1), 'utf8'));
    const json2 = JSON.parse(fs.readFileSync(path.resolve(file2), 'utf8'));

    console.log(`--- ${file1}`);
    console.log(`+++ ${file2}`);

    const diffList = diffJsonValues(json1, json2);
    for (const diffItem of diffList) {
      console.log(`@ ${toPathJqQuery(diffItem.path)} (${diffItem.type})`);
      if (diffItem.lhs !== undefined) console.log(`  - ${JSON.stringify(diffItem.lhs, null, 0)}`);
      if (diffItem.rhs !== undefined) console.log(`  + ${JSON.stringify(diffItem.rhs, null, 0)}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${error.path}`);
    } else if (error.code === 'EISDIR') {
      throw new Error(`Expected a file but found a directory: ${error.path}`);
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${error.path}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Not a valid JSON file: ${error.message}`);
    } else {
      throw error;
    }
  }
}
