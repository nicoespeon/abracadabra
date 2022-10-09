import { add } from "./maths";

add(400, 3);

const privateFn = (a, b) => {
  return a || b;
};

privateFn(0, 1);
