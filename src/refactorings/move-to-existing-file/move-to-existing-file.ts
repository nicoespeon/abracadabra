import { Editor, ErrorReason, RelativePath } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import {
  MovableNode,
  MovableEmptyStatement,
  MovableFunctionDeclaration,
  MovableTSTypeDeclaration,
  ExportedMovableFunctionDeclaration,
  ExportedMovableTSTypeDeclaration,
  MovableVariableDeclaration,
  ExportedMovableVariableDeclaration
} from "./movable-node";
import { getExportDeclaration } from "./export-declaration";

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
    VariableDeclaration(path) {
      if (!selection.isInsidePath(path)) return;

      const declarations = path.get("declarations");
      if (declarations.length !== 1) return;

      const declaration = declarations[0];
      if (!t.isSelectablePath(declaration)) return;
      if (!t.isIdentifier(declaration.node.id)) return;

      if (t.isRootNodePath(path)) {
        onMatch(
          path,
          new MovableVariableDeclaration(path, declaration.node.id)
        );
        return;
      }

      const { parentPath } = path;
      if (!t.isRootNodePath(parentPath)) return;

      const exportDeclaration = getExportDeclaration(parentPath);
      if (exportDeclaration) {
        onMatch(
          path,
          new ExportedMovableVariableDeclaration(
            path,
            declaration.node.id,
            exportDeclaration
          )
        );
        return;
      }
    },
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
