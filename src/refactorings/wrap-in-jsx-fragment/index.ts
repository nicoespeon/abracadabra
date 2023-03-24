import { Refactoring } from "../../types";
import { wrapInJsxFragment } from "./wrap-in-jsx-fragment";

const config: Refactoring = {
  command: {
    key: "wrapInJsxFragment",
    operation: wrapInJsxFragment
  }
};

export default config;
