import { ClassDeclaration, ParameterDeclaration, Project } from "ts-morph";
import * as vscode from "vscode";
import { assert } from "../../assert";
import { classNameMatcher } from "./class-name-matcher";
import { ClassRefactor } from "./class-refactor";
import { UmlNotation } from "./uml-notation";

// REFACTOR: this refactoring wasn't implemented following the usual pattern. See https://github.com/nicoespeon/abracadabra/issues/180

export class ExtractClassCommand {
  static execute(textEditor: vscode.TextEditor): Promise<void> {
    const classNode = new ClassParser(textEditor).parseClassAtCurrentLine();
    const quickPick = new QuickPick(classNode);
    const textDocument = new TextDocument(textEditor);
    const operation = new ExtractClassCommand(
      classNode,
      quickPick,
      textDocument
    );
    return operation.execute();
  }

  private readonly extractingClassName = "ExtractedClass";

  private constructor(
    private node: ClassDeclaration,
    private quickPick: QuickPick,
    private textDocument: TextDocument
  ) {}

  async execute(): Promise<void> {
    try {
      await this.tryExecute();
    } catch (error) {
      if (error instanceof Error) {
        vscode.debug.activeDebugConsole.appendLine(error.message);
      }
      vscode.window.showErrorMessage("Class extraction failed");
    }
  }

  private async tryExecute(): Promise<void> {
    const fieldsToExtract = await this.quickPick.pickFieldsToExtract();
    if (fieldsToExtract?.length) {
      await this.extractClassAndWrite(fieldsToExtract);
    } else {
      vscode.window.showInformationMessage("Class extraction canceled");
    }
  }

  private async extractClassAndWrite(fieldsToExtract: string[]): Promise<void> {
    const initialSourceText = this.node.getFullText();
    const source = new ClassRefactor(new TypescriptClassNode(this.node));
    const extracted = source.extractClass(
      this.extractingClassName,
      fieldsToExtract
    );
    await this.textDocument.replace(
      initialSourceText,
      this.getResultString(source, extracted)
    );
  }

  private getResultString(
    source: ClassRefactor,
    extracted: ClassRefactor
  ): string {
    return `${source.serialize()}\n\n${extracted.serialize()}`;
  }
}

class ClassParser {
  constructor(private textEditor: vscode.TextEditor) {}

  parseClassAtCurrentLine(): ClassDeclaration {
    return this.findClassAtFile(this.getClassNameAtCurrentLine());
  }

  private getClassNameAtCurrentLine() {
    const className = classNameMatcher.findAt(this.getCurrentLineText());
    assert(className, "Class name text not found");
    return className;
  }

  private getCurrentLineText(): string {
    return this.textEditor.document.lineAt(this.textEditor.selection.start)
      .text;
  }

  private findClassAtFile(className: string): ClassDeclaration {
    const project = new Project();
    const file = project.createSourceFile("", this.getFileText());
    return file.getClassOrThrow(className);
  }

  private getFileText(): string {
    return this.textEditor.document.getText();
  }
}

class TextDocument {
  constructor(private textEditor: vscode.TextEditor) {}

  async replace(searchValue: string, replaceValue: string): Promise<void> {
    const source = this.textEditor.document.getText();
    const result = source.replace(searchValue, replaceValue);
    await this.textEditor.edit((edit) =>
      edit.replace(this.getFullDocumentRange(), result)
    );
    await this.formatDocument();
  }

  private getFullDocumentRange(): vscode.Range {
    return new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(Infinity, Infinity)
    );
  }

  private async formatDocument(): Promise<void> {
    const docUri = this.textEditor.document.uri;
    const textEdits = (await vscode.commands.executeCommand(
      "vscode.executeFormatDocumentProvider",
      docUri
    )) as vscode.TextEdit[];
    const edit = new vscode.WorkspaceEdit();
    for (const textEdit of textEdits) {
      edit.replace(docUri, textEdit.range, textEdit.newText);
    }
    await vscode.workspace.applyEdit(edit);
  }
}

class QuickPick {
  constructor(private node: ClassDeclaration) {}

  async pickFieldsToExtract(): Promise<string[] | undefined> {
    const umlNotations = this.getFieldUmlNotations();
    const selectedItems = await vscode.window.showQuickPick(umlNotations, {
      placeHolder: "Select methods to extract",
      canPickMany: true
    });
    return selectedItems?.map((fieldName) =>
      UmlNotation.parseFieldNameFromUmlNotation(fieldName)
    );
  }

  private getFieldUmlNotations(): string[] {
    return this.node
      .getInstanceMembers()
      .filter((field) => !(field instanceof ParameterDeclaration))
      .map(UmlNotation.fromInstanceMember)
      .map((field) => field.serialize());
  }
}
