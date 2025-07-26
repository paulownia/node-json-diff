import { Writable } from 'node:stream';

/**
 * A no-op writable stream that does nothing when data is written to it.
 */
export const nullWritable: Writable = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

/**
 * A writable stream that collects written data into an array.
 * Useful for testing purposes to capture output.
 */
export class ArrayWritable extends Writable {
  #chunks: string[];

  constructor(store: string[]) {
    super({ objectMode: true });
    this.#chunks = store;
  }

  _write(chunk: string | Buffer, _encoding: string, callback: (error?: Error | null) => void): void {
    this.#chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    callback();
  }
}
