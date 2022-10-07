import { add } from "./maths";

add(3, 400);

const privateFn = (a, b) => {
  return a || b;
};

privateFn(0, 1);
