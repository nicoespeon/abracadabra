import { NodePath, Visitor } from "./ast";
import { Choice, Code, Command, Editor, Modification } from "./editor/editor";
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

export type RefactoringState = BaseRefactoringState &
  (
    | { state: "new" }
    | { state: "command not supported" }
    | {
        state: "user input response";
        value: string | undefined;
      }
    | UserChoiceResponseState
  );

type BaseRefactoringState = { code: Code; selection: Selection };

type UserChoiceResponseState<T = unknown> = {
  state: "user choice response";
  choice: Choice<T> | undefined;
};

export type EditorCommand = BaseEditorCommand &
  (
    | { action: "do nothing" }
    | { action: "show error"; reason: string; details?: unknown }
    | { action: "write"; code: Code; newCursorPosition?: Position }
    | {
        action: "read then write";
        readSelection: Selection;
        getModifications: (code: Code) => Modification[];
        newCursorPosition?: Position | Selection;
      }
    | { action: "delegate"; command: Command; selection?: Selection }
    | { action: "ask user input"; value?: string }
    | AskUserChoiceCommand
  );

type BaseEditorCommand = { thenRun?: Refactoring };

type AskUserChoiceCommand<T = unknown> = {
  action: "ask user choice";
  choices: Choice<T>[];
  placeHolder?: string;
};

export const COMMANDS = {
  showErrorDidNotFind: (element: string): EditorCommand => ({
    action: "show error",
    reason: `I didn't find ${element} from current selection 🤔`
  }),
  showErrorICant: (action: string): EditorCommand => ({
    action: "show error",
    reason: `I'm sorry, I can't ${action} 😅`
  }),
  askUserInput: (value: string): EditorCommand => ({
    action: "ask user input",
    value
  }),
  askUserChoice: <T>(
    choices: Choice<T>[],
    placeHolder?: string
  ): EditorCommand => ({
    action: "ask user choice",
    choices,
    placeHolder
  }),
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
  delegate: (command: Command, selection?: Selection): EditorCommand => ({
    action: "delegate",
    command,
    selection
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
      editor.showError(result.reason, result.details);
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
      const delegateResult = await editor.delegate(
        result.command,
        result.selection
      );
      if (delegateResult === "not supported") {
        return executeRefactoring(refactor, editor, {
          state: "command not supported",
          code: state.code,
          selection: state.selection
        });
      }
      break;
    }

    case "ask user input": {
      const userInput = await editor.askUserInput(result.value);
      return executeRefactoring(refactor, editor, {
        state: "user input response",
        value: userInput,
        code: state.code,
        selection: state.selection
      });
    }

    case "ask user choice": {
      const choice = await editor.askUserChoice(
        result.choices,
        result.placeHolder
      );
      return executeRefactoring(refactor, editor, {
        state: "user choice response",
        choice,
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
