import * as t from "../../ast";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { convertForToForEach, createVisitor } from "./convert-for-to-for-each";

describe("Convert For To Foreach", () => {
  describe("should convert for to forEach", () => {
    it("basic for-loop", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("without introducing a blank line", () => {
      shouldConvertForToForEach({
        code: `const items = ["Hello"];
[cursor]for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `const items = ["Hello"];
items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("for-loop with member expressions we can't replace", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(items[3]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
  console.log(items[3]);
});`
      });
    });

    it("selected for-loop only", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}

[cursor]for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}

items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("nested for-loop, cursor on wrapper", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
}`,
        expected: `items.forEach(item => {
  console.log(item);

  for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
});`
      });
    });

    it("nested for-loop, cursor on nested", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  [cursor]for (let j = 0; j < items.length; j++) {
    console.log(items[j]);
  }
}`,
        expected: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  items.forEach(item => {
    console.log(item);
  });
}`
      });
    });

    it("nested for-loop, cursor on nested, nested would be invalid forEach", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);

  [cursor]for (let j = 0; j < 10; j++) {
    console.log(items[j]);
  }
}`,
        expected: `items.forEach(item => {
  console.log(item);

  for (let j = 0; j < 10; j++) {
    console.log(items[j]);
  }
});`
      });
    });

    it("for-loop without block statement", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++)
  console.log(items[i]);`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("for-loop with array identifier that is singular", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < myArray.length; i++) {
  console.log(myArray[i]);
}`,
        expected: `myArray.forEach(myArrayItem => {
  console.log(myArrayItem);
});`
      });
    });

    it("for-loop with array re-assignment", () => {
      shouldConvertForToForEach({
        code: `const myArray = [1, 2, 3];

[cursor]for (let i = 0; i < myArray.length; i++) {
  myArray[i] = myArray[i].toString();
}`,
        expected: `const myArray = [1, 2, 3];

myArray.forEach((myArrayItem, i) => {
  myArray[i] = myArrayItem.toString();
});`
      });
    });

    it("accessor referenced inside the body", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(i);
}`,
        expected: `items.forEach((item, i) => {
  console.log(item);
  console.log(i);
});`
      });
    });

    it("lesser or equal", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i <= items.length - 1; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("decrementing accessor", () => {
      shouldConvertForToForEach({
        code: `for (let i = items.length - 1; i >= 0; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("decrementing accessor, strict greater than", () => {
      shouldConvertForToForEach({
        code: `for (let i = items.length - 1; i > -1; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("list is a member expression itself", () => {
      shouldConvertForToForEach({
        code: `for (let i = 0; i < this.data[0].items.length; i++) {
  console.log(this.data[0].items[i]);
}`,
        expected: `this.data[0].items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("for-of", () => {
      shouldConvertForToForEach({
        code: `const items = ['foo', 'bar', 'baz'];

[cursor]for (const val of items) {
  console.log(val);
}`,
        expected: `const items = ['foo', 'bar', 'baz'];

items.forEach(val => {
  console.log(val);
});`
      });
    });

    it("selected for-of only", () => {
      shouldConvertForToForEach({
        code: `const items = ['foo', 'bar', 'baz'];

for (const val of items) {
  console.log(val);
}

[cursor]for (const val of items) {
  console.log(val);
}`,
        expected: `const items = ['foo', 'bar', 'baz'];

for (const val of items) {
  console.log(val);
}

items.forEach(val => {
  console.log(val);
});`
      });
    });

    it("for-of, with object destructuring", () => {
      shouldConvertForToForEach({
        code: `const items = [{name: 'joe', age: 40}, {name: 'danielle', age: 25}, {name: 'jane', age: 50}];

[cursor]for (const {name, age} of items) {
  console.log(name, age);
}`,
        expected: `const items = [{name: 'joe', age: 40}, {name: 'danielle', age: 25}, {name: 'jane', age: 50}];

items.forEach(({name, age}) => {
  console.log(name, age);
});`
      });
    });

    it("for-of, with array destructuring", () => {
      shouldConvertForToForEach({
        code: `const items = [[0, 1], [1, 2], [2, 3]];

[cursor]for (const [one, two] of items) {
  console.log(one, two);
}`,
        expected: `const items = [[0, 1], [1, 2], [2, 3]];

items.forEach(([one, two]) => {
  console.log(one, two);
});`
      });
    });

    it("for-of, without block statement", () => {
      shouldConvertForToForEach({
        code: `const items = ['foo', 'bar', 'baz'];

[cursor]for (const item of items)
  console.log(item);`,
        expected: `const items = ['foo', 'bar', 'baz'];

items.forEach(item => {
  console.log(item);
});`
      });
    });

    it("for-of, inline", () => {
      shouldConvertForToForEach({
        code: `for (const item of ['foo', 'bar', 'baz'])
  console.log(item);`,
        expected: `['foo', 'bar', 'baz'].forEach(item => {
  console.log(item);
});`
      });
    });

    it("for-of, with member expression on the right", () => {
      shouldConvertForToForEach({
        code: `for (const item of foo.bar) {
  console.log(item);
}`,
        expected: `foo.bar.forEach(item => {
  console.log(item);
});`
      });
    });

    it("nested for-of, cursor on nested", () => {
      shouldConvertForToForEach({
        code: `const items = ['foo', 'bar', 'baz'];

for (const x of items) {
  for (const y of items) {[cursor]
    console.log(x * y);
  }
}`,
        expected: `const items = ['foo', 'bar', 'baz'];

for (const x of items) {
  items.forEach(y => {
    console.log(x * y);
  });
}`
      });
    });

    it("preserves comments", () => {
      shouldConvertForToForEach({
        code: `// leading comment
[cursor]for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}
// trailing comment`,
        expected: `// leading comment
items.forEach(item => {
  console.log(item);
});
// trailing comment`
      });
    });
  });

  describe("should not convert", () => {
    it("standard for-loop", () => {
      shouldNotConvert(`for (let i = 0; i < 10; i++) {
  console.log(items[i]);
}`);
    });

    it("not using the list length to iterate", () => {
      shouldNotConvert(`for (let i = 0; i < items.count; i++) {
  console.log(items[i]);
}`);
    });

    it("for-loop with init not starting at 0", () => {
      shouldNotConvert(`for (let i = 1; i < items.length; i++) {
  console.log(items[i]);
}`);
    });

    it("for-of but a string", () => {
      shouldNotConvert(`const str = 'abcde';
  for (let character of str) {
  console.log(character);
}`);
    });

    it("for-of but an inline string", () => {
      shouldNotConvert(`for (let character of 'abcde') {
  console.log(character);
}`);
    });

    // 👇 These patterns could be converted (they support forEach) but are not implemented yet.
    it("for-of but a map", () => {
      shouldNotConvert(`const map = new Map();
map.set('Me', {text: 'hello'});
for (let entry of map) {
  console.log(entry);
}`);
    });

    it("for-of but a set", () => {
      shouldNotConvert(`const set = new Set();
set.add('Me');
for (let entry of set) {
  console.log(entry);
}`);
    });

    it("for-of but a typed array", () => {
      shouldNotConvert(`const typedArray = new Int8Array(8);
typedArray[0] = 32;
for (let entry of typedArray) {
  console.log(entry);
}`);
    });
  });

  it("should call onMatch for a matching for-loop", async () => {
    const code = `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`;
    const onMatch = jest.fn();

    t.traverseAST(t.parse(code), {
      enter(path) {
        const visitor = createVisitor(Selection.cursorAt(0, 0), onMatch);
        const visitorNode = visitor[path.node.type];
        if (typeof visitorNode === "function") {
          // @ts-expect-error visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
          visitorNode.bind(visitor)(path, path.state);
        }
      }
    });

    expect(onMatch).toHaveBeenCalled();
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertForToForEach({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });
});

function shouldConvertForToForEach({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertForToForEach({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertForToForEach({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
