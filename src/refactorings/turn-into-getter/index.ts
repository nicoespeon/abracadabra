import { turnIntoGetter, createVisitor } from "./turn-into-getter";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "turnIntoGetter",
    operation: turnIntoGetter,
    title: "Turn Into Getter"
  },
  actionProvider: {
    message: "Turn into getter",
    createVisitor
  }
};

export default config;
