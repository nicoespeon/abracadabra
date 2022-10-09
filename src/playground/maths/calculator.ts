import { add } from "./maths";

add(3, 400);

function privateFn(a: number, b: number) {
  return a || b;
}

privateFn(0, 1);
