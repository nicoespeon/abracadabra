import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { assert } from "../assert";
import { referencesInScope } from "./scope";
import { parseAndTraverseCode } from "./transformation";

describe("Scope", () => {
  it("should return the correct number of paths that references the target function", () => {
    let functionPath: NodePath<t.FunctionDeclaration> | undefined;
    const code = `import { Input } from "./types";
import logger, { LEVEL } from "./logger";

function sayHello(input: Input) {
  const hello = "Hello " + input;
  logger(hello, LEVEL.info);
}

function targetFn() {}

function callTarget() {
  targetFn();
}

targetFn();`;
    parseAndTraverseCode(code, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === "targetFn") functionPath = path;
      }
    });

    assert(functionPath, "Could not find target function from AST");

    const result = referencesInScope(functionPath);

    expect(result).toHaveLength(2);
  });
});
