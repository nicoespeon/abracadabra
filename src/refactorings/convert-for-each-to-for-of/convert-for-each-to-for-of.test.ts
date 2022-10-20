import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";
import { convertForEachToForOf } from "./convert-for-each-to-for-of";

describe("Convert forEach to for-of", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert for each to for of",
    [
      {
        description: "basic forEach",
        code: `
items.forEach((item) => {
  console.log(item);
});`,
        expected: `
for (const item of items) {
  console.log(item);
}`
      },
      {
        description: "without introducing a blank line",
        code: `
const items = [];
[cursor]items.forEach((item) => {
  console.log(item);
});`,
        expected: `
const items = [];
for (const item of items) {
  console.log(item);
}`
      },
      {
        description: "forEach with arrow without braces",
        code: `
items.forEach((item) => console.log(item));`,
        expected: `
for (const item of items) {
  console.log(item);
}`
      },
      {
        description: "destructuring array",
        code: `
map.forEach(([key, value]) => {
  console.log(key, value);
});`,
        expected: `
for (const [key, value] of map) {
  console.log(key, value);
}`
      },
      {
        description: "destructuring object",
        code: `
items.forEach(({a, b}) => console.log(a, b));`,
        expected: `
for (const {a, b} of items) {
  console.log(a, b);
}`
      },
      {
        description: "converts return to continue",
        code: `
items.forEach((item) => {
  if (item.type === 'foo')
    return;
  console.log(item);
});`,
        expected: `
for (const item of items) {
  if (item.type === 'foo')
    continue;
  console.log(item);
}`
      },
      {
        description: "ignores returns inside of arrow functions",
        code: `
items.forEach((item) => {
  item.props.find(() => {
    return prop.isValid;
  });
  console.log(item);
});`,
        expected: `
for (const item of items) {
  item.props.find(() => {
    return prop.isValid;
  });
  console.log(item);
}`
      },
      {
        description: "ignores returns inside of function expressions",
        code: `
items.forEach((item) => {
  item.props.find(function() {
    return prop.isValid;
  });
  console.log(item);
});`,
        expected: `
for (const item of items) {
  item.props.find(function() {
    return prop.isValid;
  });
  console.log(item);
}`
      },
      {
        description: "ignores returns inside of function declarations",
        code: `
items.forEach((item) => {
  function getIsValid() {
    return prop.isValid;
  }
  console.log(item);
});`,
        expected: `
for (const item of items) {
  function getIsValid() {
    return prop.isValid;
  }
  console.log(item);
}`
      },
      {
        description: "ignores forEach with bare function",
        code: `
items.forEach(doSomething);`,
        expected: `
items.forEach(doSomething);`
      },
      {
        description: "ignores when you use the index param",
        code: `
items.forEach((item, index) => {
  console.log(item, index);
});`,
        expected: `
items.forEach((item, index) => {
  console.log(item, index);
});`
      },
      {
        description: "ignores if there are more args to forEach",
        code: `
items.forEach((item) => {
  console.log(item);
}, anotherParam);`,
        expected: `
items.forEach((item) => {
  console.log(item);
}, anotherParam);`
      },
      {
        description: "selected forEach only",
        code: `
items.forEach((item) => {
  items.values.for[cursor]Each((value) => {
    console.log(value);
  });
});`,
        expected: `
items.forEach((item) => {
  for (const value of items.values) {
    console.log(value);
  }
});`
      },
      {
        description: "preserves comments",
        code: `
// leading comment
[cursor]items.forEach((item) => {
  console.log(item);
});
// trailing comment`,
        expected: `
// leading comment
for (const item of items) {
  console.log(item);
}
// trailing comment`
      },
      {
        description: "preserves comments for return",
        code: `
items.forEach((item) => {
  if (item.type === 'foo') {
    // leading comment
    return;
    // trailing comment
  }
  console.log(item);
});`,
        expected: `
for (const item of items) {
  if (item.type === 'foo') {
    // leading comment
    continue;
    // trailing comment
  }
  console.log(item);
}`
      }
    ].map(({ description, code, expected }) => ({
      description,
      code: code.trim(),
      expected: expected.trim()
    })),
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertForEachToForOf(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertForEachToForOf(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindForEachToConvertToForOf
    );
  });
});
