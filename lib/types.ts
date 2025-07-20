export type DiffItem = {
  path: (string | number)[];
  lhs: JsonValue | undefined;
  rhs: JsonValue | undefined;
  type: string;
};

export type JsonNull = null;

export type JsonPrimitive = string | number | boolean;

export type JsonObject = Record<string, unknown>;

export type JsonArray = unknown[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray | JsonNull;

export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
