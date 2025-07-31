// Path utility for jq query
import { PathElement } from './types.js';

/**
 * Convert a path array to a jq query string
 */
export function pathArrayToJqQuery(pathArray: PathElement[]): string {
  // ["a", "b", "c"] -> .a.b.c
  // ["a", 0, "c"] -> .a[0].c
  // [""]  // -> .
  // [0]   // -> .[0]
  // Key-based:
  //   [".users", {type: "keySelect", keyField: "id", keyValue: 3}] -> .users[] | select(.id == 3)
  //   [".users", {type: "keySelect", keyField: "id", keyValue: 3}, "name"] -> .users[] | select(.id == 3) | .name

  if (pathArray.length === 0) return '.';

  let result = '';

  if (typeof pathArray[0] !== 'string') {
    // start with a dot for the root element,
    result += '.';
  }

  for (let i = 0; i < pathArray.length; i++) {
    const element = pathArray[i];
    if (typeof element === 'string') {
      if (element.includes('.') || element.includes('[') || element.includes(']')) {
        result += `."${element}"`;
      } else {
        result += `.${element}`;
      }
    } else if (typeof element === 'number') {
      result += `[${element}]`;
    } else if (element.type === 'keySelect') {
      // Key-based selection: .users[] | select(.id == 3)
      result += `[] | select(.${element.keyField} == ${JSON.stringify(element.keyValue)})`;
      // add ' | ' to result if this element is not the last one,
      if (i < pathArray.length - 1) {
        result += ' | ';
      }
    }
  }

  return result;
}
