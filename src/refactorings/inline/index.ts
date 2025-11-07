import {
  EditorCommand,
  RefactoringState,
  RefactoringWithActionProviderConfig
} from "../../refactorings";
import { inlineFunction } from "./inline-function/inline-function";
import {
  createVisitor as canInlineVariable,
  inlineVariable
} from "./inline-variable/inline-variable";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "inline",
    title: "Inline Variable/Function",
    operation: inline
  },
  actionProvider: {
    // Only support Inline Variable as a quick fix for now.
    message: "Inline variable",
    createVisitor: canInlineVariable
  }
};

export default config;

function inline(state: RefactoringState): EditorCommand {
  const result = inlineVariable(state);
  return result.action === "show error" ? inlineFunction(state) : result;
}
