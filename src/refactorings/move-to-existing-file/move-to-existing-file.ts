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
    createVisitor(selection, (path, importIdentifier, matchingMovableNode) => {
      movableNode = matchingMovableNode;

      t.addImportDeclaration(
        path.parentPath,
        importIdentifier,
        relativePath.withoutExtension
      );
      path.remove();
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
  onMatch: (
    path: t.RootNodePath,
    importIdentifier: t.Identifier,
    movableNode: MovableNode
  ) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!t.isRootNodePath(path)) return;
      if (!path.node.id) return;
      if (!selection.isInsidePath(path)) return;

      const body = path.get("body");
      if (!t.isSelectablePath(body)) return;

      const bodySelection = Selection.fromAST(body.node.loc);
      if (selection.end.isAfter(bodySelection.start)) return;

      onMatch(path, path.node.id, new MovableFunctionDeclaration(path));
    },
    TSTypeAliasDeclaration(path) {
      if (!t.isRootNodePath(path)) return;
      if (!path.node.id) return;
      if (!selection.isInsidePath(path)) return;

      onMatch(path, path.node.id, new MovableTSTypeDeclaration(path));
    },
    TSInterfaceDeclaration(path) {
      if (!t.isRootNodePath(path)) return;
      if (!path.node.id) return;
      if (!selection.isInsidePath(path)) return;

      onMatch(path, path.node.id, new MovableTSTypeDeclaration(path));
    }
  };
}

interface MovableNode {
  readonly value: t.Declaration | null;
  readonly hasReferencesThatCantBeImported: boolean;
  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[];
}

class MovableEmptyStatement implements MovableNode {
  readonly value = null;
  readonly hasReferencesThatCantBeImported = false;

  declarationsToImportFrom(_relativePath: RelativePath): t.ImportDeclaration[] {
    return [];
  }
}

class MovableFunctionDeclaration implements MovableNode {
  private _value: t.FunctionDeclaration;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(path: t.RootNodePath<t.FunctionDeclaration>) {
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
}

class MovableTSTypeDeclaration implements MovableNode {
  private _value: t.TypeDeclaration;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(path: t.RootNodePath<t.TypeDeclaration>) {
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
}
