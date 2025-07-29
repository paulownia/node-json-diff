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

  for (let i = 0; i < pathArray.length; i++) {
    const element = pathArray[i];

    if (typeof element === 'string') {
      if (element.includes('.') || element.includes('[') || element.includes(']')) {
        result += `."${element}"`;
      } else {
        result += `.${element}`;
      }
    } else if (typeof element === 'number') {
      if (i === 0) {
        result += `.[${element}]`;
      } else {
        result += `[${element}]`;
      }
    } else if (element.type === 'keySelect') {
      // Key-based selection: .users[] | select(.id == 3)
      result += `[] | select(.${element.keyField} == ${JSON.stringify(element.keyValue)})`;

      // 後続の要素があれば | .field 形式で追加
      if (i + 1 < pathArray.length) {
        const remainingElements = pathArray.slice(i + 1);
        const fieldPath = remainingElements.map(el => {
          if (typeof el === 'string') {
            if (el.includes('.') || el.includes('[') || el.includes(']')) {
              return `."${el}"`;
            } else {
              return `.${el}`;
            }
          } else if (typeof el === 'number') {
            return `[${el}]`;
          }
          // keySelect が連続することは想定していない
          return '';
        }).join('');

        if (fieldPath) {
          result += ` | ${fieldPath}`;
        }
        break; // keySelectの後は処理完了
      }
    }
  }

  return result;
}
