---
to: src/refactorings/<%= h.changeCase.param(name) %>/<%= h.changeCase.param(name) %>.test.ts
---
<%
  camelName = h.changeCase.camel(name)
  pascalCase = h.changeCase.pascalCase(name)
  dashedName = h.changeCase.param(name)
  titleName = h.changeCase.titleCase(name)
-%>
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { <%= camelName %> } from "./<%= dashedName %>";

describe("<%= titleName %>", () => {
  it("TODO: scenario", () => {
    should<%= pascalCase %>({
      code: `TODO: fill`,
      expected: `TODO: fill`
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;

    const result = <%= camelName %>({
      state: "new",
      code,
      selection: Selection.cursorAt(0, 0)
    });

    expect(result.action).toBe("show error");
  });
});

function should<%= pascalCase %>({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = <%= camelName %>({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
