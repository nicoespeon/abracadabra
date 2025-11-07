import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertForEachToForOf } from "./convert-for-each-to-for-of";

describe("Convert forEach to for-of", () => {
  describe("should convert for each to for of", () => {
    it("basic forEach", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  console.log(item);
});`,
        expected: `for (const item of items) {
  console.log(item);
}`
      });
    });

    it("without introducing a blank line", () => {
      shouldConvertForEachToForOf({
        code: `const items = [];
[cursor]items.forEach((item) => {
  console.log(item);
});`,
        expected: `const items = [];
for (const item of items) {
  console.log(item);
}`
      });
    });

    it("forEach with arrow without braces", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => console.log(item));`,
        expected: `for (const item of items) {
  console.log(item);
}`
      });
    });

    it("destructuring array", () => {
      shouldConvertForEachToForOf({
        code: `map.forEach(([key, value]) => {
  console.log(key, value);
});`,
        expected: `for (const [key, value] of map) {
  console.log(key, value);
}`
      });
    });

    it("destructuring object", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach(({a, b}) => console.log(a, b));`,
        expected: `for (const {a, b} of items) {
  console.log(a, b);
}`
      });
    });

    it("converts return to continue", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  if (item.type === 'foo')
    return;
  console.log(item);
});`,
        expected: `for (const item of items) {
  if (item.type === 'foo')
    continue;
  console.log(item);
}`
      });
    });

    it("ignores returns inside of arrow functions", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  item.props.find(() => {
    return prop.isValid;
  });
  console.log(item);
});`,
        expected: `for (const item of items) {
  item.props.find(() => {
    return prop.isValid;
  });
  console.log(item);
}`
      });
    });

    it("ignores returns inside of function expressions", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  item.props.find(function() {
    return prop.isValid;
  });
  console.log(item);
});`,
        expected: `for (const item of items) {
  item.props.find(function() {
    return prop.isValid;
  });
  console.log(item);
}`
      });
    });

    it("ignores returns inside of function declarations", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  function getIsValid() {
    return prop.isValid;
  }
  console.log(item);
});`,
        expected: `for (const item of items) {
  function getIsValid() {
    return prop.isValid;
  }
  console.log(item);
}`
      });
    });

    it("ignores forEach with bare function", () => {
      shouldNotConvert(`items.forEach(doSomething);`);
    });

    it("ignores when you use the index param", () => {
      shouldNotConvert(`items.forEach((item, index) => {
  console.log(item, index);
});`);
    });

    it("ignores if there are more args to forEach", () => {
      shouldNotConvert(`items.forEach((item) => {
  console.log(item);
}, anotherParam);`);
    });
    it("selected forEach only", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  items.values.for[cursor]Each((value) => {
    console.log(value);
  });
});`,
        expected: `items.forEach((item) => {
  for (const value of items.values) {
    console.log(value);
  }
});`
      });
    });

    it("preserves comments", () => {
      shouldConvertForEachToForOf({
        code: `// leading comment
[cursor]items.forEach((item) => {
  console.log(item);
});
// trailing comment`,
        expected: `// leading comment
for (const item of items) {
  console.log(item);
}
// trailing comment`
      });
    });

    it("preserves comments for return", () => {
      shouldConvertForEachToForOf({
        code: `items.forEach((item) => {
  if (item.type === 'foo') {
    // leading comment
    return;
    // trailing comment
  }
  console.log(item);
});`,
        expected: `for (const item of items) {
  if (item.type === 'foo') {
    // leading comment
    continue;
    // trailing comment
  }
  console.log(item);
}`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertForEachToForOf({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertForEachToForOf({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertForEachToForOf({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertForEachToForOf({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
