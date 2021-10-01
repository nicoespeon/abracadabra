export interface Logger {
  error(message: string, details?: { [key: string]: any }): void;
}
