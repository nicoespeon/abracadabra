import jscodeshift from "jscodeshift";
// @ts-ignore Directly import the source code from "react-codemod"
import * as reactCodemod from "react-codemod/transforms/pure-component";
const pureComponent = reactCodemod.default;

import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import * as t from "../../../ast";

export { convertToPureComponent, canConvertToPureComponent };

async function convertToPureComponent(
  code: Code,
  _selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code);

  if (!updatedCode) {
    editor.showError(ErrorReason.DidNotFoundReactComponent);
    return;
  }

  await editor.write(updatedCode);
}

function canConvertToPureComponent(ast: t.AST, _selection: Selection): boolean {
  const code = t.generate(ast);
  return updateCode(code) !== null;
}

function updateCode(code: Code): Code | null {
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

  const options = {
    useArrows: true,
    destructuring: true,
    printOptions: {}
  };

  return pureComponent(file, api, options);
}
