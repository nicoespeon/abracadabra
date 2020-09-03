---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.test.ts
---
<%
  camelName = h.changeCase.camel(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
  noCaseName = h.changeCase.noCase(name)

  pascalErrorName = h.changeCase.pascalCase(errorReason.name)
-%>
import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { <%= camelName %> } from "./<%= dashedName %>";

describe("<%= titleName %>", () => {
  testEach<{ code: Code; expected: Code }>(
    "should <%= noCaseName %>",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await <%= camelName %>(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await <%= camelName %>(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.<%= pascalErrorName %>);
  });
});
