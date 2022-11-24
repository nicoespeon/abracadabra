import { add, subtract, Maths } from "./maths";

add(3, 400);
subtract(5, 500);

const math = new Maths();
math.add(0, 1);

// Used to view what params generates in webview table
function viewParametersTable(
  literal: number | string | boolean,
  obj = {},
  [desc, descTwo, ...rest]: any[],
  { item, itemTwo, ...anotherRest }: Record<string, any>
) {}
