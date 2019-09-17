import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Object Pattern", () => {
  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should inline the destructured variable value",
    [
      {
        description: "basic scenario",
        code: `const { userId } = session;
messages.map(message => ({ userId }));`,
        expected: `messages.map(message => ({ userId: session.userId }));`
      },
      {
        description: "renamed, cursor on key",
        code: `const { userId: id } = session;
messages.map(message => ({ id }));`,
        expected: `messages.map(message => ({ id: session.userId }));`
      },
      {
        description: "renamed, cursor on value",
        code: `const { userId: id } = session;
messages.map(message => ({ id }));`,
        selection: Selection.cursorAt(0, 17),
        expected: `messages.map(message => ({ id: session.userId }));`
      },
      {
        description: "not assigned to another object",
        code: `const { userId } = session;
console.log(userId);`,
        expected: `console.log(session.userId);`
      },
      {
        description: "init being a member expression",
        code: `const { id } = session.user;
console.log(id);`,
        expected: `console.log(session.user.id);`
      },
      {
        description: "init being a member expression with a numeric literal",
        code: `const { id } = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0].id);`
      },
      {
        description: "init being a member expression with a string literal",
        code: `const { id } = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"].id);`
      },
      {
        description: "nested",
        code: `const { user: { id } } = session;
console.log(id);`,
        selection: Selection.cursorAt(0, 17),
        expected: `console.log(session.user.id);`
      },
      {
        description: "nested, init being a member expression",
        code: `const { user: { data: { n: firstName} } } = session.data[0];
console.log(firstName);`,
        selection: Selection.cursorAt(0, 28),
        expected: `console.log(session.data[0].user.data.n);`
      },
      {
        description: "multi-line",
        code: `const {
  user: {
    n: name
  }
} = session;
console.log(name);`,
        selection: Selection.cursorAt(2, 4),
        expected: `console.log(session.user.n);`
      },
      {
        description: "in a multiple declaration",
        code: `const name = "John", { userId } = session, age = 12;
console.log(userId);`,
        selection: Selection.cursorAt(0, 24),
        expected: `const name = "John", age = 12;
console.log(session.userId);`
      },
      {
        description: "with other elements destructured, before",
        code: `const { user: { id, name } } = session;
console.log(name);`,
        selection: Selection.cursorAt(0, 21),
        expected: `const { user: { id } } = session;
console.log(session.user.name);`
      },
      {
        description: "with other elements destructured, after",
        code: `const { user: { id, name } } = session;
console.log(id);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const { user: { name } } = session;
console.log(session.user.id);`
      },
      {
        description: "with other elements destructured, before & after",
        code: `const { user: { id, name, age }, date } = session;
console.log(name);`,
        selection: Selection.cursorAt(0, 21),
        expected: `const { user: { id, age }, date } = session;
console.log(session.user.name);`
      },
      {
        description: "with other elements destructured, multi-lines",
        code: `const {
  user: {
    id,
    n: name,
    age
  },
  date
} = session,
  lastName = "Smith";
console.log(name);`,
        selection: Selection.cursorAt(3, 4),
        expected: `const {
  user: {
    id,
    age
  },
  date
} = session,
  lastName = "Smith";
console.log(session.user.n);`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 9), expected }) => {
      const result = await doInlineVariable(code, selection);
      expect(result).toBe(expected);
    }
  );

  async function doInlineVariable(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    await inlineVariable(code, selection, editor);
    return editor.code;
  }
});
