import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { assert } from "../assert";
import { Position } from "../editor/position";
import { Selection } from "../editor/selection";
import {
  isShadowIn,
  referencesInScope,
  selectableReferencesInScope
} from "./scope";
import { isSelectableNode } from "./selection";
import { parseAndTraverseCode, traverseNode } from "./transformation";

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

  it("should identify shadowed Identifiers in an arrow function expression", async () => {
    const code = `const title = document.title;
const lambda = (title: string) => title.length > 0;`;
    let identifier: NodePath<t.Identifier> | undefined;
    parseAndTraverseCode(code, {
      Identifier(path) {
        if (
          path.parentPath.isVariableDeclarator() &&
          path.node.name === "title"
        ) {
          identifier = path;
          path.stop();
        }
      }
    });
    assert(identifier, "Could not find Identifier from AST");
    const programScope = identifier.parentPath?.parentPath?.parent;
    assert(programScope, "Could not find Program scope from AST");
    const ancestors = await findAncestorAtPosition(
      programScope,
      new Position(1, 16)
    );
    expect(ancestors.length).toBeGreaterThan(0);

    const result = isShadowIn(identifier.node, ancestors);

    expect(result).toBe(true);
  });

  it("should find all references to an Identifier", () => {
    let identifierPath: NodePath<t.Identifier> | undefined;
    const code = `function doSomething(req) {
  const liftPassCost = req.query.cost;
  const liftPassType = req.query.type;

  console.log(liftPassCost, liftPassType);
}`;
    parseAndTraverseCode(code, {
      Identifier(path) {
        if (path.node.name !== "req") return;
        identifierPath = path;
        path.stop();
      }
    });

    assert(
      identifierPath?.node.name === "req",
      "Could not find target Identifier from AST"
    );

    const result = selectableReferencesInScope(identifierPath);

    expect(result).toHaveLength(3);
  });

  it("should find all references to an Identifier in children scopes", () => {
    let identifierPath: NodePath<t.Identifier> | undefined;
    const code = `function doSomething(result) {
  let cost = 0;

  if (isMonday) {
    cost = 10;
    if (isHoliday) {
      cost = 20;
      result.cost = 100;
    }
  }

  function ignoredBecauseShadowed(cost) {
    console.log(cost);
  }

  console.log(cost);
}`;
    parseAndTraverseCode(code, {
      Identifier(path) {
        if (path.node.name !== "cost") return;
        identifierPath = path;
        path.stop();
      }
    });

    assert(
      identifierPath?.node.name === "cost",
      "Could not find target Identifier from AST"
    );

    const result = selectableReferencesInScope(identifierPath);

    expect(result).toHaveLength(4);
  });
});

function findAncestorAtPosition(
  scope: t.Node,
  position: Position
): Promise<t.TraversalAncestors> {
  return new Promise<t.TraversalAncestors>((resolve, reject) =>
    traverseNode(scope, {
      enter(node, ancestors) {
        if (!isSelectableNode(node)) {
          return reject("Node should be selectable");
        }

        const nodeStart = Selection.fromAST(node.loc).start;
        if (nodeStart.isEqualTo(position)) {
          // Copy ancestors to avoid mutations
          resolve([...ancestors]);
        }
      }
    })
  );
}
