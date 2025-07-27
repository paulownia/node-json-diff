// Path utility for jq query

/**
 * Convert a path array to a jq query string
 */
export function toPathJqQuery(pathArray: (string | number)[]): string {
  // ["a", "b", "c"] -> .a.b.c
  // ["a", 0, "c"] -> .a[0].c
  // [""]  // -> .
  // [0]   // -> [0]
  if (pathArray.length === 0) return '.';

  return pathArray.map((p, i) => {
    if (typeof p === 'number') {
      if (i === 0) {
        return `.[${p}]`; // For the first element, use dot notation for root access
      } else {
        return `[${p}]`;
      }
    }

    if (p.includes('.') || p.includes('[') || p.includes(']')) {
      return `."${p}"`;
    } else {
      return `.${p}`;
    }
  }).join('');
}
