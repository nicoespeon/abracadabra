import { Logger } from "../logger";

export class ConsoleLogger implements Logger {
  error(message: string, details: { [key: string]: any } = {}) {
    console.error(message, details);
  }
}
