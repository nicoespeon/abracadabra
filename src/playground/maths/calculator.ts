import { add } from "./maths";

add(3, 400);

// Used to view what params generates in webview table
function viewParametersTable(
  literal: number | string | boolean,
  obj = {},
  [desc, descTwo, ...rest]: any[],
  { item, itemTwo, ...anotherRest }: Record<string, any>
) {}
