import { Code, Command, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";

export interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

export interface RefactoringWithActionProvider {
  command: {
    key: string;
    title: string;
    operation: Operation;
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

export type Operation = (editor: Editor) => Promise<void>;

export interface RefactoringWithActionProvider__NEW {
  command: {
    key: string;
    title: string;
    operation: Operation__NEW;
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

export type Operation__NEW = (state: RefactoringState) => EditorCommand;

export type RefactoringState =
  | ({ state: "new" } & BaseRefactoringState)
  | ({ state: "command not supported" } & BaseRefactoringState)
  | ({
      state: "user response";
      value: string | undefined;
    } & BaseRefactoringState);

type BaseRefactoringState = { code: Code; selection: Selection };

export type EditorCommand =
  | { action: "do nothing" }
  | { action: "show error"; reason: string }
  | { action: "write"; code: Code }
  | { action: "delegate"; command: Command }
  | { action: "ask user"; value?: string };

export const COMMANDS = {
  showErrorDidNotFind: (element: string): EditorCommand => ({
    action: "show error",
    reason: `I didn't find ${element} from current selection 🤔`
  }),
  askUser: (value: string): EditorCommand => ({ action: "ask user", value }),
  write: (code: Code): EditorCommand => ({ action: "write", code }),
  delegate: (command: Command): EditorCommand => ({
    action: "delegate",
    command
  }),
  doNothing: (): EditorCommand => ({ action: "do nothing" })
};
