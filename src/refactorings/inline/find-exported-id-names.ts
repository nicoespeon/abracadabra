import * as t from "../../ast";

export function findExportedIdNames(scope: t.Node): t.Identifier["name"][] {
  const result: t.Identifier["name"][] = [];

  t.traverseNode(scope, {
    enter(node) {
      // Pattern `export default foo`
      if (
        t.isExportDefaultDeclaration(node) &&
        t.isIdentifier(node.declaration)
      ) {
        result.push(node.declaration.name);
      }

      if (t.isExportNamedDeclaration(node)) {
        // Pattern `export const foo = "bar", hello = "world"`
        if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach(({ id }) => {
            if (!("name" in id)) return;
            result.push(id.name);
          });
        }

        // Pattern `export type Value = "one" | "many" | "none";`
        if (t.isTSTypeAliasDeclaration(node.declaration)) {
          result.push(node.declaration.id.name);
        }

        // Pattern `export { foo, hello }`
        node.specifiers.forEach((specifier) => {
          if (!t.isExportSpecifier(specifier)) return;
          result.push(specifier.local.name);
        });
      }
    }
  });

  return result;
}
