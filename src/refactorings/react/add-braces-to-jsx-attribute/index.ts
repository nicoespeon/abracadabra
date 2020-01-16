import {
  addBracesToJsxAttribute,
  hasJsxAttributeToAddBracesTo
} from "./add-braces-to-jsx-attribute";

import { RefactoringWithActionProvider } from "../../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "addBracesToJsxAttribute",
    operation: addBracesToJsxAttribute,
    title: "Add Braces To Jsx Attribute"
  },
  actionProvider: {
    message: "Add braces to jsx attribute",
    canPerform: hasJsxAttributeToAddBracesTo
  }
};

export default config;
