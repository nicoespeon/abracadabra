import { Editor, ErrorReason, RelativePath } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export async function moveToExistingFile(editor: Editor) {
  const { code, selection } = editor;

  const files = await editor.workspaceFiles();
  if (files.length === 0) {
    editor.showError(ErrorReason.DidNotFindOtherFiles);
    return;
  }

  const selectedFile = await editor.askUserChoice(
    files.map((path) => ({
      value: path,
      label: path.fileName,
      description: path.withoutFileName,
      icon: "file-code"
    })),
    "Search files by name and pick one"
  );
  if (!selectedFile) return;

  const relativePath = selectedFile.value;
  const { updatedCode, movableNode } = updateCode(
    t.parse(code),
    selection,
    relativePath
  );

  if (!movableNode.value) {
    editor.showError(ErrorReason.DidNotFindCodeToMove);
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindCodeToMove);
    return;
  }

  if (movableNode.hasReferencesThatCantBeImported) {
    editor.showError(ErrorReason.CantImportReferences);
    return;
  }

  const otherFileCode = await editor.codeOf(relativePath);
  const otherFileUpdatedCode = updateOtherFileCode(
    t.parse(otherFileCode),
    movableNode.value,
    movableNode.declarationsToImportFrom(relativePath)
  );

  await editor.writeIn(relativePath, otherFileUpdatedCode.code);
  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection,
  relativePath: RelativePath
): {
  updatedCode: t.Transformed;
  movableNode: MovableNode;
} {
  let movableNode: MovableNode = new MovableEmptyStatement();

  const updatedCode = t.transformAST(
    ast,
    createVisitor(selection, (path, node) => {
      movableNode = node;
      node.removeFrom(relativePath);
      path.stop();
    })
  );

  return {
    updatedCode,
    movableNode
  };
}

function updateOtherFileCode(
  ast: t.AST,
  movedNode: t.Declaration,
  declarationsToImport: t.ImportDeclaration[]
): t.Transformed {
  return t.transformAST(ast, {
    Program(path) {
      declarationsToImport.forEach((declaration) => {
        declaration.specifiers.forEach((specifier) => {
          t.addImportDeclaration(
            path,
            specifier.local,
            declaration.source.value
          );
        });
      });

      const exportedStatement = t.toStatement(
        t.exportNamedDeclaration(movedNode)
      );
      if (exportedStatement) {
        path.node.body.push(exportedStatement);
      }
    }
  });
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, movableNode: MovableNode) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!t.hasNodeId(path)) return;
      if (!selection.isInsidePath(path)) return;

      const body = path.get("body");
      if (!t.isSelectablePath(body)) return;

      const bodySelection = Selection.fromAST(body.node.loc);
      if (selection.end.isAfter(bodySelection.start)) return;

      if (t.isRootNodePath(path)) {
        onMatch(path, new MovableFunctionDeclaration(path));
        return;
      }

      const { parentPath } = path;
      if (!t.isRootNodePath(parentPath)) return;

      const exportDeclaration = getExportDeclaration(parentPath);
      if (exportDeclaration) {
        onMatch(
          path,
          new ExportedMovableFunctionDeclaration(path, exportDeclaration)
        );
        return;
      }
    },
    TSTypeAliasDeclaration(path) {
      if (!t.hasNodeId(path)) return;
      if (!selection.isInsidePath(path)) return;

      if (t.isRootNodePath(path)) {
        onMatch(path, new MovableTSTypeDeclaration(path));
        return;
      }

      const { parentPath } = path;
      if (!t.isRootNodePath(parentPath)) return;

      const exportDeclaration = getExportDeclaration(parentPath);
      if (exportDeclaration) {
        onMatch(
          path,
          new ExportedMovableTSTypeDeclaration(path, exportDeclaration)
        );
        return;
      }
    },
    TSInterfaceDeclaration(path) {
      if (!t.hasNodeId(path)) return;
      if (!selection.isInsidePath(path)) return;

      if (t.isRootNodePath(path)) {
        onMatch(path, new MovableTSTypeDeclaration(path));
        return;
      }

      const { parentPath } = path;
      if (!t.isRootNodePath(parentPath)) return;

      const exportDeclaration = getExportDeclaration(parentPath);
      if (exportDeclaration) {
        onMatch(
          path,
          new ExportedMovableTSTypeDeclaration(path, exportDeclaration)
        );
        return;
      }
    }
  };
}

interface MovableNode {
  readonly value: t.Declaration | null;
  readonly hasReferencesThatCantBeImported: boolean;
  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[];
  removeFrom(filePath: RelativePath): void;
}

class MovableEmptyStatement implements MovableNode {
  readonly value = null;
  readonly hasReferencesThatCantBeImported = false;

  declarationsToImportFrom(_relativePath: RelativePath): t.ImportDeclaration[] {
    return [];
  }

  removeFrom() {}
}

class MovableFunctionDeclaration implements MovableNode {
  private _value: t.WithId<t.FunctionDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    private path: t.PathWithId<t.RootNodePath<t.FunctionDeclaration>>
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    this._value = path.node;
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      path,
      path.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      path,
      path.parentPath
    );
  }

  get value(): t.FunctionDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.path.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.path.remove();
  }
}

class ExportedMovableFunctionDeclaration implements MovableNode {
  private _value: t.WithId<t.FunctionDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    path: t.PathWithId<t.NodePath<t.FunctionDeclaration>>,
    private exportDeclaration: ExportDeclaration
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    this._value = path.node;
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      path,
      exportDeclaration.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      path,
      exportDeclaration.parentPath
    );
  }

  get value(): t.FunctionDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.exportDeclaration.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.exportDeclaration.replaceWith(this._value.id);
  }
}

class MovableTSTypeDeclaration implements MovableNode {
  private _value: t.WithId<t.TypeDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(private path: t.PathWithId<t.RootNodePath<t.TypeDeclaration>>) {
    this._value = path.node;
    this._hasReferencesThatCantBeImported =
      t.hasTypeReferencesDefinedInSameScope(path);
    this._referencedImportDeclarations = t.getTypeReferencedImportDeclarations(
      path,
      path.parentPath
    );
  }

  get value(): t.TypeDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.path.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.path.remove();
  }
}

class ExportedMovableTSTypeDeclaration implements MovableNode {
  private _value: t.WithId<t.TypeDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    path: t.PathWithId<t.NodePath<t.TypeDeclaration>>,
    private exportedDeclaration: ExportDeclaration
  ) {
    this._value = path.node;
    this._hasReferencesThatCantBeImported =
      t.hasTypeReferencesDefinedInSameScope(path);
    this._referencedImportDeclarations = t.getTypeReferencedImportDeclarations(
      path,
      exportedDeclaration.parentPath
    );
  }

  get value(): t.TypeDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.exportedDeclaration.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.exportedDeclaration.replaceWith(this._value.id);
  }
}

function getExportDeclaration(path: t.RootNodePath): ExportDeclaration | null {
  return path.isExportNamedDeclaration()
    ? new NamedExportDeclaration(path)
    : path.isExportDefaultDeclaration()
    ? new DefaultExportDeclaration(path)
    : null;
}

interface ExportDeclaration {
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
