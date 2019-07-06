import { Write, Code } from "../editor/i-write-code";

export { createWriteInMemory };

function createWriteInMemory(code: Code): [Write, () => Code] {
  return [
    (newCode: Code) => {
      code = newCode;
      return Promise.resolve();
    },
    () => code
  ];
}
