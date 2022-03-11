import * as t from "../../ast";

export function getExportDeclaration(
  path: t.NodePath
): ExportDeclaration | null {
  if (t.isRootNodePath(path)) return new NoExportDeclaration(path);

  const { parentPath } = path;
  if (!parentPath || !t.isRootNodePath(parentPath)) return null;

  return parentPath.isExportNamedDeclaration()
    ? new NamedExportDeclaration(parentPath)
    : parentPath.isExportDefaultDeclaration()
    ? new DefaultExportDeclaration(parentPath)
    : new NoExportDeclaration(parentPath);
}

export interface ExportDeclaration {
  readonly parentPath: t.NodePath<t.Program>;
  replaceWith(id: t.Identifier): void;
}

class NoExportDeclaration implements ExportDeclaration {
  constructor(private path: t.RootNodePath) {}

  get parentPath(): t.NodePath<t.Program> {
    return this.path.parentPath;
  }

  replaceWith() {
    this.path.remove();
  }
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
