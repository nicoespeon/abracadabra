export function add(num2, param) {
  return param + num2;
}

add(200, 1);

function privateFn(a, b) {
  return a || b;
}

privateFn(0, 1);
