import { add, subtract } from "./maths";

add(3, 400);
subtract(5, 500);

// Used to view what params generates in webview table
function viewParametersTable(
  literal: number | string | boolean,
  obj = {},
  [desc, descTwo, ...rest]: any[],
  { item, itemTwo, ...anotherRest }: Record<string, any>
) {}
