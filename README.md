# json-diff-cli

A command-line tool to compare JSON files and show differences in a unified diff format.

## Installation

```bash
npm install -g @paulownia/json-diff
```

## Usage

### Command Line

```bash
json-diff file1.json file2.json
```

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
@ .age
- 30
+ 31
@ .city
- "New York"
+ "Los Angeles"
@ .hobbies
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
import { diffJsonFiles, diffJsonValues } from '@paulownia/json-diff';

// Compare two JSON files
diffJsonFiles('file1.json', 'file2.json');

// Compare two JSON objects
const obj1 = { name: 'John', age: 30 };
const obj2 = { name: 'John', age: 31 };
const differences = diffJsonValues(obj1, obj2);
console.log(differences);
```

## API

### `diffJsonFiles(file1, file2)`

Compare two JSON files and output the differences to console.

- `file1` (string): Path to the first JSON file
- `file2` (string): Path to the second JSON file

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

- Node.js >= 14.0.0

## License

MIT
