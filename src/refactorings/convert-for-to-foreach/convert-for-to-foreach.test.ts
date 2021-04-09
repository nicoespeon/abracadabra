import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";
import * as t from "../../ast";

import {
  canConvertForLoop,
  convertForToForeach
} from "./convert-for-to-foreach";
import { Selection } from "../../editor/selection";

describe("Convert For To Foreach", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert for to foreach",
    [
      {
        description: "basic for-loop",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "without introducing a blank line",
        code: `const items = ["Hello"];
[cursor]for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `const items = ["Hello"];
items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "for-loop with member expressions we can't replace",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(items[3]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
  console.log(items[3]);
});`
      },
      {
        description: "selected for-loop only",
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
      },
      {
        description: "nested for-loop, cursor on wrapper",
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
      },
      {
        description: "nested for-loop, cursor on nested",
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
      },
      {
        description: "nested for-loop, cursor on nested, nested invalid",
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
      },
      {
        description: "for-loop without block statement",
        code: `for (let i = 0; i < items.length; i++)
  console.log(items[i]);`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "accessor referenced inside the body",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(i);
}`,
        expected: `items.forEach((item, i) => {
  console.log(item);
  console.log(i);
});`
      },
      {
        description: "lesser or equal",
        code: `for (let i = 0; i <= items.length - 1; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "decrementing accessor",
        code: `for (let i = items.length - 1; i >= 0; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "decrementing accessor, strict greater than",
        code: `for (let i = items.length - 1; i > -1; i--) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "list is a member expression itself",
        code: `for (let i = 0; i < this.data[0].items.length; i++) {
  console.log(this.data[0].items[i]);
}`,
        expected: `this.data[0].items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "for-of",
        code: `const items = ['foo', 'bar', 'baz'];

[cursor]for (const val of items) {
  console.log(val);
}`,
        expected: `const items = ['foo', 'bar', 'baz'];

items.forEach(val => {
  console.log(val);
});`
      },
      {
        description: "selected for-of only",
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
      },
      {
        description: "for-of, with object destructuring",
        code: `const items = [{name: 'joe', age: 40}, {name: 'danielle', age: 25}, {name: 'jane', age: 50}];

[cursor]for (const {name, age} of items) {
  console.log(name, age);
}`,
        expected: `const items = [{name: 'joe', age: 40}, {name: 'danielle', age: 25}, {name: 'jane', age: 50}];

items.forEach(({name, age}) => {
  console.log(name, age);
});`
      },
      {
        description: "for-of, with array destructuring",
        code: `const items = [[0, 1], [1, 2], [2, 3]];

[cursor]for (const [one, two] of items) {
  console.log(one, two);
}`,
        expected: `const items = [[0, 1], [1, 2], [2, 3]];

items.forEach(([one, two]) => {
  console.log(one, two);
});`
      },
      {
        description: "for-of, without block statement",
        code: `const items = ['foo', 'bar', 'baz'];

[cursor]for (const item of items)
  console.log(item);`,
        expected: `const items = ['foo', 'bar', 'baz'];

items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "for-of, inline",
        code: `for (const item of ['foo', 'bar', 'baz'])
  console.log(item);`,
        expected: `['foo', 'bar', 'baz'].forEach(item => {
  console.log(item);
});`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertForToForeach(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not convert",
    [
      {
        description: "standard for-loop",
        code: `for (let i = 0; i < 10; i++) {
  console.log(items[i]);
}`
      },
      {
        description: "not using the list length to iterate",
        code: `for (let i = 0; i < items.count; i++) {
  console.log(items[i]);
}`
      },
      {
        description: "for-loop with init not starting at 0",
        code: `for (let i = 1; i < items.length; i++) {
  console.log(items[i]);
}`
      },
      {
        description: "for-of but a string",
        code: `const str = 'abcde';
  for (let character of str) {
  console.log(character);
}`
      },
      {
        description: "for-of but an inline string",
        code: `for (let character of 'abcde') {
  console.log(character);
}`
      },
      // 👇 These patterns could be converted (they support forEach) but are not implemented yet.
      {
        description: "for-of but a map",
        code: `const map = new Map();
map.set('Me', {text: 'hello'});
for (let entry of map) {
  console.log(entry);
}`
      },
      {
        description: "for-of but a set",
        code: `const set = new Set();
set.add('Me');
for (let entry of set) {
  console.log(entry);
}`
      },
      {
        description: "for-of but a set",
        code: `const typedArray = new Int8Array(8);
typedArray[0] = 32;
for (let entry of typedArray) {
  console.log(entry);
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await convertForToForeach(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should call onMatch for a matching for-loop", async () => {
    const code = `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`;
    const onMatch = jest.fn();

    t.traverseAST(t.parse(code), {
      enter(path) {
        const visitor = canConvertForLoop(Selection.cursorAt(0, 0), onMatch);
        const visitorNode = visitor[path.node.type];
        if (typeof visitorNode === "function") {
          // @ts-expect-error visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
          visitorNode.bind(visitor)(path, path.state);
        }
      }
    });

    expect(onMatch).toHaveBeenCalled();
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertForToForeach(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindForLoopToConvert
    );
  });
});
