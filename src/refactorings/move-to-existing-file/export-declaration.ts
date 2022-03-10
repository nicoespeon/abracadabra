import * as t from "../../ast";

export function getExportDeclaration(
  path: t.RootNodePath
): ExportDeclaration | null {
  return path.isExportNamedDeclaration()
    ? new NamedExportDeclaration(path)
    : path.isExportDefaultDeclaration()
    ? new DefaultExportDeclaration(path)
    : null;
}

export interface ExportDeclaration {
  readonly parentPath: t.NodePath<t.Program>;
  replaceWith(id: t.Identifier): void;
}

class NamedExportDeclaration implements ExportDeclaration {
  constructor(private path: t.RootNodePath<t.ExportNamedDeclaration>) {}

  get parentPath(): t.NodePath<t.Program> {
    return this.path.parentPath;
  }

  replaceWith(id: t.Identifier) {
    this.path.node.specifiers.push(t.exportSpecifier(id, id));
    this.path.node.declaration = null;
  }
}

class DefaultExportDeclaration implements ExportDeclaration {
  constructor(private path: t.RootNodePath<t.ExportDefaultDeclaration>) {}

  get parentPath(): t.NodePath<t.Program> {
    return this.path.parentPath;
  }

  replaceWith(id: t.Identifier) {
    this.path.node.declaration = id;
  }
}
