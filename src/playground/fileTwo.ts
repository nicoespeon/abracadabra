import { add } from "./maths";

add(7, 800);

let privateFn;
privateFn = function (a, b) {
  return a || b;
};

privateFn(0, 1);
