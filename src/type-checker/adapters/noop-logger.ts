import { Logger } from "../logger";

export class NoopLogger implements Logger {
  error() {}
}
