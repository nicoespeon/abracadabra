import { NodePath, Visitor } from "./ast";
import { Code, Command, Editor, Modification } from "./editor/editor";
import { Position } from "./editor/position";
import { Selection } from "./editor/selection";

export interface RefactoringConfig__DEPRECATED {
  command: {
    key: string;
    operation: Refactoring__DEPRECATED;
  };
}

export interface RefactoringConfig {
  command: {
    key: string;
    operation: Refactoring;
  };
}

export interface RefactoringWithActionProviderConfig__DEPRECATED {
  command: {
    key: string;
    title: string;
    operation: Refactoring__DEPRECATED;
  };
  actionProvider: {
    message: string;
    isPreferred?: boolean;
    createVisitor: (
      selection: Selection,
      onMatch: (path: NodePath) => void
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

export interface RefactoringWithActionProviderConfig {
  command: {
    key: string;
    title: string;
    operation: Refactoring;
  };
  actionProvider: {
    message: string;
    isPreferred?: boolean;
    createVisitor: (
      selection: Selection,
      onMatch: (path: NodePath) => void
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

/**
 * We use to inject an instance of the Editor to the refactoring function,
 * which was asynchronously performing some side-effects.
 *
 * The new version is a pure function that takes and return data instead.
 *
 * This will allow us to move the Refactoring computation elsewhere, like
 * a dedicated language server. This should unblock more ambitious refactorings
 * and improve the performance of the extension.
 */
export type Refactoring__DEPRECATED = (editor: Editor) => Promise<void>;

export type Refactoring = (state: RefactoringState) => EditorCommand;

export type RefactoringState = (
  | { state: "new" }
  | { state: "command not supported" }
  | {
      state: "user response";
      value: string | undefined;
    }
) &
  BaseRefactoringState;

type BaseRefactoringState = { code: Code; selection: Selection };

export type EditorCommand = (
  | { action: "do nothing" }
  | { action: "show error"; reason: string }
  | { action: "write"; code: Code; newCursorPosition?: Position }
  | {
      action: "read then write";
      readSelection: Selection;
      getModifications: (code: Code) => Modification[];
      newCursorPosition?: Position | Selection;
    }
  | { action: "delegate"; command: Command }
  | { action: "ask user"; value?: string }
) &
  BaseEditorCommand;

type BaseEditorCommand = { thenRun?: Refactoring };

export const COMMANDS = {
  showErrorDidNotFind: (element: string): EditorCommand => ({
    action: "show error",
    reason: `I didn't find ${element} from current selection 🤔`
  }),
  showErrorICant: (action: string): EditorCommand => ({
    action: "show error",
    reason: `I'm sorry, I can't ${action} 😅`
  }),
  askUser: (value: string): EditorCommand => ({ action: "ask user", value }),
  write: (
    code: Code,
    newCursorPosition?: Position,
    options: BaseEditorCommand = {}
  ): EditorCommand => ({
    action: "write",
    code,
    newCursorPosition,
    ...options
  }),
  readThenWrite: (
    readSelection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position | Selection
  ): EditorCommand => ({
    action: "read then write",
    readSelection,
    getModifications,
    newCursorPosition
  }),
  delegate: (command: Command): EditorCommand => ({
    action: "delegate",
    command
  }),
  doNothing: (): EditorCommand => ({ action: "do nothing" })
};

export async function executeRefactoring(
  refactor: Refactoring,
  editor: Editor,
  state: RefactoringState = {
    state: "new",
    code: editor.code,
    selection: editor.selection
  }
) {
  const result = refactor(state);

  switch (result.action) {
    case "do nothing":
      break;

    case "show error":
      editor.showError(result.reason);
      break;

    case "write":
      await editor.write(result.code, result.newCursorPosition);
      break;

    case "read then write": {
      await editor.readThenWrite(
        result.readSelection,
        result.getModifications,
        result.newCursorPosition
      );
      break;
    }

    case "delegate": {
      const delegateResult = await editor.delegate(result.command);
      if (delegateResult === "not supported") {
        return executeRefactoring(refactor, editor, {
          state: "command not supported",
          code: state.code,
          selection: state.selection
        });
      }
      break;
    }

    case "ask user": {
      const userInput = await editor.askUserInput(result.value);
      return executeRefactoring(refactor, editor, {
        state: "user response",
        value: userInput,
        code: state.code,
        selection: state.selection
      });
    }

    default: {
      const exhaustiveCheck: never = result;
      console.error(`Unhandled type: ${exhaustiveCheck}`);
      break;
    }
  }

  if (result.thenRun) {
    return executeRefactoring(result.thenRun, editor);
  }
}
