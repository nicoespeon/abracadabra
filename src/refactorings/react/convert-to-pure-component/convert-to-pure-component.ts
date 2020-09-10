import jscodeshift from "jscodeshift";
// @ts-expect-error Directly import the source code from "react-codemod"
import * as reactCodemod from "react-codemod/transforms/pure-component";
const pureComponent = reactCodemod.default;

import { Editor, Code, ErrorReason } from "../../../editor/editor";

export { convertToPureComponent };

async function convertToPureComponent(editor: Editor) {
  const { code } = editor;
  const useArrowsChoice = await editor.askUser([
    { value: true, label: "Use an arrow function" },
    { value: false, label: "Use a function declaration" }
  ]);

  if (!useArrowsChoice) return;

  const destructuringChoice = await editor.askUser([
    { value: true, label: "Destructure props" },
    { value: false, label: "Don't destructure props" }
  ]);

  if (!destructuringChoice) return;

  const updatedCode = updateCode(code, {
    useArrows: useArrowsChoice.value,
    destructuring: destructuringChoice.value
  });

  if (!updatedCode) {
    editor.showError(ErrorReason.DidNotFindReactComponent);
    return;
  }

  await editor.write(updatedCode);
}

type Options = {
  useArrows: boolean;
  destructuring: boolean;
};

function updateCode(code: Code, options?: Options): Code | null {
  const file = {
    path: "irrelevant",
    source: code
  };

  const irrelevant = () => {};
  const api = {
    jscodeshift,
    stats: irrelevant,
    report: irrelevant
  };

  const finalOptions = {
    ...options,
    printOptions: {}
  };

  return pureComponent(file, api, finalOptions);
}
