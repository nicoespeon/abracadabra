import { template } from "@babel/core";
import { ESLint } from "eslint";
import * as t from "../../../ast";
import { Editor, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";

const eslint = new ESLint({
  fix: true,
  useEslintrc: false,
  overrideConfig: {
    plugins: ["react-hooks"],
    rules: {
      "react-hooks/exhaustive-deps": "error"
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      },
      ecmaVersion: 6,
      sourceType: "module"
    }
  }
});

export async function extractUseCallback(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindExtractUseCallback);
    return;
  }

  const fixed = await fixReactHooksExhaustiveDeps(updatedCode.code);

  await editor.write(fixed);
}

async function fixReactHooksExhaustiveDeps(code: string): Promise<string> {
  const results = await eslint.lintText(code);
  const fix = results[0]?.messages[0]?.suggestions?.[0]?.fix;
  return fix
    ? code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1])
    : code;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, { attrName, fn }) => {
      const scopePath = path.scope.path;
      if (!scopePath.isFunction()) {
        return;
      }

      let extractedName = attrName;
      let counter = 2;
      while (path.scope.hasBinding(extractedName)) {
        extractedName = attrName + counter;
        counter++;

        // Avoid an infinite loop, just in case
        if (counter > 10) {
          return;
        }
      }

      const id = t.identifier(extractedName);
      const node = template.statement`
        const ID = useCallback(FN, []);
      `({ ID: id, FN: fn.node });

      const body = scopePath.get("body");
      if (body.isExpression()) {
        body.replaceWith(
          t.blockStatement([node, t.returnStatement(body.node)])
        );
        fn.replaceWith(id);
        return;
      }

      const jsxStatement = path.getStatementParent();
      if (!jsxStatement) return;

      jsxStatement.insertBefore(node);
      fn.replaceWith(id);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.SelectablePath<t.JSXAttribute>,
    args: {
      attrName: string;
      fn: t.NodePath<t.FunctionExpression | t.ArrowFunctionExpression>;
    }
  ) => void
): t.Visitor {
  return {
    JSXAttribute(path) {
      if (!selection.isInsidePath(path)) return;
      const name = path.get("name");
      if (!name.isJSXIdentifier()) return;
      const value = path.get("value");
      if (!value.isJSXExpressionContainer()) return;
      const fn = value.get("expression");
      if (!fn.isArrowFunctionExpression() && !fn.isFunctionExpression()) return;
      onMatch(path, { attrName: name.node.name, fn });
    }
  };
}
