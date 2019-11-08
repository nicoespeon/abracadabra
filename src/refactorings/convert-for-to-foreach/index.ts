import {
  canConvertForLoop,
  convertForToForeach
} from "./convert-for-to-foreach";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "abracadabra.convertForToForeach",
  operation: convertForToForeach,
  title: "Convert For-Loop to ForEach",
  actionProviderMessage: "Convert to forEach",
  canPerformRefactoring: canConvertForLoop,
  isPreferred: true
};

export default config;
