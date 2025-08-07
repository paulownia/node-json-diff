export class InvalidJsonFileError extends Error {
  constructor(fileName: string) {
    super(`Invalid JSON file: ${fileName}`);
    this.name = 'InvalidJsonFileError';
  }
}
