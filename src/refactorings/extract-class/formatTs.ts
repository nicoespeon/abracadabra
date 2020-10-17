import { format } from "prettier";

export function formatTs(value: string): string {
  return format(value, {
    parser: "typescript",
    singleQuote: true
  }).replace(/\n+/g, "\n");
}
