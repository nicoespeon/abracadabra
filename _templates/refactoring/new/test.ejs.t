---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.test.ts
---
<%
  camelName = h.changeCase.camel(name)
  pascalName = h.changeCase.pascalCase(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  noCaseName = h.changeCase.noCase(name)

  pascalErrorName = h.changeCase.pascalCase(errorReason.name)
-%>
import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { <%= camelName %> } from "./<%= dashedName %>";

describe("<%= titleName %>", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should <%= noCaseName %>",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await do<%= pascalName %>(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await do<%= pascalName %>(code, selection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.<%= pascalErrorName %>);
  });

  async function do<%= pascalName %>(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await <%= camelName %>(code, selection, editor);
    return editor.code;
  }
});
