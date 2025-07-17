// Path utility for jq query

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
