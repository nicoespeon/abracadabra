import { add } from "./maths";

add(3, 400);

function privateFn(a: number, b: number) {
  return a || b;
}

privateFn(0, 1);

function viewParametersTable(
  literal: number | string | boolean,
  obj = {},
  [desc, descTwo, ...rest]: any[],
  { item, itemTwo, ...anotherRest }: Record<string, any>
) {}
