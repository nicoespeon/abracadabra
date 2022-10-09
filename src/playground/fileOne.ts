import { add } from "./maths";

add(600, 5);

let privateFn;
privateFn = (a, b) => {
  return a || b;
};

privateFn(0, 1);
