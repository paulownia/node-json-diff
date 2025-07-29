export type PathElement = string | number | {
  type: 'keySelect';
  keyField: string;
  keyValue: unknown;
};

export type DiffItem = {
  path: PathElement[];
  lhs: JsonValue | undefined;
  rhs: JsonValue | undefined;
  type: string;
};

export const ArrayDiffAlgorithms = ['lcs', 'set', 'elem', 'key'] as const;

export type ArrayDiffAlgorithm = typeof ArrayDiffAlgorithms[number];

export type DiffOptions = {
  arrayDiffAlgorithm: ArrayDiffAlgorithm;
  arrayKey?: string;
};

export type JsonNull = null;

export type JsonPrimitive = string | number | boolean;

export type JsonObject = Record<string, unknown>;

export type JsonArray = unknown[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray | JsonNull;

export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function isArrayDiffAlgorithm(value: unknown): value is ArrayDiffAlgorithm {
  return typeof value === 'string' && ArrayDiffAlgorithms.includes(value as ArrayDiffAlgorithm);
}
