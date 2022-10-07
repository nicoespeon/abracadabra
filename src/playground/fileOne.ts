import { add } from "./maths";

add(5, 600);

let privateFn;
privateFn = (a, b) => {
  return a || b;
};

privateFn(0, 1);
