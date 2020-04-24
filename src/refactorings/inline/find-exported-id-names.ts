import * as ast from "../../ast";

export { findExportedIdNames };

function findExportedIdNames(scope: ast.Node): ast.Identifier["name"][] {
  let result: ast.Identifier["name"][] = [];

  ast.traverseNode(scope, {
    enter(node) {
      // Pattern `export default foo`
      if (
        ast.isExportDefaultDeclaration(node) &&
        ast.isIdentifier(node.declaration)
      ) {
        result.push(node.declaration.name);
      }

      if (ast.isExportNamedDeclaration(node)) {
        // Pattern `export const foo = "bar", hello = "world"`
        if (ast.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach(({ id }) => {
            if (!("name" in id)) return;
            result.push(id.name);
          });
        }

        // Pattern `export type Value = "one" | "many" | "none";`
        if (ast.isTSTypeAliasDeclaration(node.declaration)) {
          result.push(node.declaration.id.name);
        }

        // Pattern `export { foo, hello }`
        node.specifiers.forEach(specifier => {
          if (!ast.isExportSpecifier(specifier)) return;
          result.push(specifier.local.name);
        });
      }
    }
  });

  return result;
}
