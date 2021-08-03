import * as t from "@babel/types";
import assert from "assert";

import { allPathsReturn } from "./identity";
import { parseAndTraverseCode } from "./transformation";

describe("allPathsReturn", () => {
  it("should return true for a single return statement", () => {
    const blockStatement = wrapInBlockStatement(`return "anything";`);

    const result = allPathsReturn(blockStatement);

    expect(result).toBe(true);
  });

  it("should return false for a statements that don't have a return", () => {
    const blockStatement = wrapInBlockStatement(`console.log("irrelevant")`);

    const result = allPathsReturn(blockStatement);

    expect(result).toBe(false);
  });
});

function wrapInBlockStatement(code: string): t.BlockStatement {
  let blockStatement: t.BlockStatement | undefined = undefined;

  parseAndTraverseCode(`{${code}}`, {
    BlockStatement(path) {
      blockStatement = path.node;
    }
  });
  assert(typeof blockStatement !== "undefined", "No block statement found");

  return blockStatement;
}
