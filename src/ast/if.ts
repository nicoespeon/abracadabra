import * as t from "@babel/types";

export { getConsequentNodes };

function getConsequentNodes(
  consequent: t.IfStatement["consequent"]
): t.Statement[] {
  return t.isBlockStatement(consequent) ? consequent.body : [consequent];
}
