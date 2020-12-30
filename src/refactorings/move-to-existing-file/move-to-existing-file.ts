import { Editor, ErrorReason, RelativePath } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { moveToExistingFile, createVisitor };

async function moveToExistingFile(editor: Editor) {
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
  const { updatedCode, movedNode, declarationsToImport } = updateCode(
    t.parse(code),
    selection,
    relativePath
  );

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindCodeToMove);
    return;
  }

  const otherFileCode = await editor.codeOf(relativePath);
  const otherFileUpdatedCode = updateOtherFileCode(
    t.parse(otherFileCode),
    movedNode,
    declarationsToImport
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
  movedNode: t.Node;
  declarationsToImport: t.ImportDeclaration[];
} {
  let movedNode: t.Node = t.emptyStatement();
  let declarationsToImport: t.ImportDeclaration[] = [];

  const updatedCode = t.transformAST(
    ast,
    createVisitor(selection, (path, importIdentifier, programPath) => {
      movedNode = path.node;

      const importSpecifier = t.importSpecifier(
        importIdentifier,
        importIdentifier
      );

      const existingDeclaration = t
        .getImportDeclarations(programPath)
        .find(
          ({ source: { value } }) => value === relativePath.withoutExtension
        );

      if (existingDeclaration) {
        existingDeclaration.specifiers.push(importSpecifier);
      } else {
        const importStatement = t.importDeclaration(
          [importSpecifier],
          t.stringLiteral(relativePath.withoutExtension)
        );
        programPath.node.body.unshift(importStatement);
      }

      declarationsToImport = t
        .getReferencedImportDeclarations(path, programPath)
        .map((declaration) => {
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

      path.remove();
    })
  );

  return { updatedCode, movedNode, declarationsToImport };
}

function updateOtherFileCode(
  ast: t.AST,
  movedNode: t.Node,
  declarationsToImport: t.ImportDeclaration[]
): t.Transformed {
  return t.transformAST(ast, {
    Program(path) {
      declarationsToImport.forEach((declaration) => {
        path.node.body.unshift(declaration);
      });

      const exportedStatement = t.toStatement(
        t.exportNamedDeclaration(movedNode)
      );
      path.node.body.push(exportedStatement);
    }
  });
}

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.FunctionDeclaration>,
    importIdentifier: t.Identifier,
    program: t.NodePath<t.Program>
  ) => void
): t.Visitor {
  return {
    FunctionDeclaration(path) {
      if (!path.parentPath.isProgram()) return;
      if (!path.node.id) return;
      if (!selection.isInsidePath(path)) return;

      const body = path.get("body");
      if (!t.isSelectablePath(body)) return;

      const bodySelection = Selection.fromAST(body.node.loc);
      if (selection.end.isAfter(bodySelection.start)) return;

      onMatch(path, path.node.id, path.parentPath);
    }
  };
}
