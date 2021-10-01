import { Position } from "../../editor/position";
import { TSPosition } from "./ts-position";

const code = `const hello = "world";
console.log(hello);
// End of code snippet`;

it("should take Position character when at line 0", () => {
  const position = new Position(0, 4);

  const tsPosition = new TSPosition(code, position);

  expect(tsPosition.value).toBe(4);
});

it("should add 1 per new line", () => {
  const position = new Position(1, 0);

  const tsPosition = new TSPosition(code, position);

  expect(tsPosition.value).toBe(23);
});

it("should handle empty lines", () => {
  const code = `const hello = "world";


// End of code snippet`;
  const position = new Position(3, 0);

  const tsPosition = new TSPosition(code, position);

  expect(tsPosition.value).toBe(25);
});

it("should count trailing spaces", () => {
  // Use non-breakable spaces to prevent editors from trimming them
  const nbsp = " ";
  const code = `const hello = "world";${nbsp}${nbsp}
// End of code snippet`;
  const position = new Position(1, 0);

  const tsPosition = new TSPosition(code, position);

  expect(tsPosition.value).toBe(25);
});

it("should work if Position is outside of code range", () => {
  const code = `const hello = "world";`;
  const position = new Position(4, 5);

  const tsPosition = new TSPosition(code, position);

  expect(tsPosition.value).toBe(26);
});
