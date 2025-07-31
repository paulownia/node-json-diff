# json-diff

[![CI](https://github.com/paulownia/node-json-diff/actions/workflows/ci.yml/badge.svg)](https://github.com/paulownia/node-json-diff/actions/workflows/ci.yml)

A command-line tool to compare JSON files and show differences.

## Installation

```bash
npm install -g @paulownia/json-diff
```

## Usage

### Command Line

```bash
json-diff file1.json file2.json
```

### Options

- `--array-diff` (or `-a`): Array diff algorithm (default: `elem`)
  - `elem`: Compare arrays element by element. Arrays must have the same length for detailed comparison
  - `lcs`: Use Myers algorithm (Longest Common Subsequence) for array comparison
  - `set`: Treat arrays as sets, ignoring element order
  - `key`: Compare arrays of objects by matching them using a unique identifier field
- `--array-key` (or `-k`): Key field for key-based array comparison (default: `id`). Only used with `--array-diff key`

#### Array Diff Algorithms

**elem (Element-wise comparison):**
```bash
json-diff file1.json file2.json --array-diff elem
```
This is the default behavior. Arrays are compared element by element at the same index. If arrays have different lengths, they are treated as completely different.

**lcs (Myers algorithm):**
```bash
json-diff file1.json file2.json --array-diff lcs
```
Uses the Myers algorithm to find the longest common subsequence. This provides standard diff output showing additions and deletions.

**set (Set comparison):**
```bash
json-diff file1.json file2.json --array-diff set
```
Treats arrays as sets, ignoring the order of elements. Only shows elements that exist in one array but not the other.

**key (Key-based comparison):**
```bash
json-diff file1.json file2.json --array-diff key --array-key id
```
Compares arrays of objects by matching them using a unique identifier field (default: `id`). Objects with the same key value are compared for detailed differences, while objects that exist in only one array are marked as added or deleted. Order is ignored. Note: Objects that don't have the specified key field are ignored and not included in the comparison.

### Example

Given two JSON files:

**file1.json:**
```json
{
  "name": "John",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "swimming"]
}
```

**file2.json:**
```json
{
  "name": "John",
  "age": 31,
  "city": "Los Angeles",
  "hobbies": ["reading", "cycling", "swimming"]
}
```

Running `json-diff file1.json file2.json` will output:

```
--- file1.json
+++ file2.json
@ .age (modified)
  - 30
  + 31
@ .city (modified)
  - "New York"
  + "Los Angeles"
@ .hobbies (modified)
  - ["reading","swimming"]
  + ["reading","cycling","swimming"]
```

The `@` lines show the path to each difference in jq query format, which can be used directly with the `jq` command-line tool. For example:

```bash
# Get the age value from file1.json
jq '.age' file1.json

# Get the hobbies array from file2.json
jq '.hobbies' file2.json
```

## Programmatic Usage

You can also use this package as a library in your Node.js applications:

```javascript
import { printJsonFilesDiff, diffJsonFiles, diffJsonValues } from '@paulownia/json-diff';

// Compare two JSON files and print diff
printJsonFilesDiff(process.stdout, 'file1.json', 'file2.json');

// Compare two JSON files
const fileDifferences = diffJsonFiles('file1.json', 'file2.json')
console.log(fileDifferences);

// Compare two JSON objects
const obj1 = { name: 'John', age: 30 };
const obj2 = { name: 'John', age: 31 };
const objectDifferences = diffJsonValues(obj1, obj2);
console.log(objectDifferences);
```

## API

### `printJsonFilesDiff(out, file1, file2)`

Compare two JSON files and output the differences to console.

- `out` (Writable): Output stream to write the diff
- `file1` (string): Path to the first JSON file
- `file2` (string): Path to the second JSON file

### `diffJsonFiles(json1, json2)`

Compare two JSON files and return the differences as an array.

- `json1` (any): First JSON object
- `json2` (any): Second JSON object
- Returns: Array of difference objects

### `diffJsonValues(json1, json2)`

Compare two JSON objects and return the differences as an array.

- `json1` (any): First JSON object
- `json2` (any): Second JSON object
- Returns: Array of difference objects

### Difference Object Structure

Each difference object has the following structure:

```javascript
{
  path: Array,    // Path to the differing value (e.g., ['user', 'name'])
  lhs: any,       // Left-hand side value (undefined if not present)
  rhs: any        // Right-hand side value (undefined if not present)
}
```

## Features

- Compare JSON files and objects
- Unified diff output format
- JQ-style path notation for easy navigation (compatible with `jq` command)
- Support for nested objects and arrays
- Handles null values and type differences
- Command-line interface and programmatic API

## Requirements

- Node.js >= 18.0.0

## License

MIT
