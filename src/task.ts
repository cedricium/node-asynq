import { Options, DEFAULT_OPTIONS } from "./options";

type JSONPrimitive = string | number | boolean | null | undefined;

export type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | {
      [key: string]: JSONValue;
    };

/** Task represents a unit of work to be performed. */
export class Task {
  typeName: string;
  payload: Buffer;
  opts: Options;

  constructor(typeName: string, payload: JSONValue, opts?: Options) {
    this.typeName = typeName;
    this.payload = Buffer.from(JSON.stringify(payload));
    this.opts = opts || DEFAULT_OPTIONS;
  }
}
