import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { testEach } from "../../../tests-helpers";

import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Object Pattern", () => {
  testEach<{ code: Code; expected: Code }>(
    "should inline the destructured variable value",
    [
      {
        description: "basic scenario",
        code: `const { u[cursor]serId } = session;
messages.map(message => ({ userId }));`,
        expected: `messages.map(message => ({ userId: session.userId }));`
      },
      {
        description: "renamed, cursor on key",
        code: `const { u[cursor]serId: id } = session;
messages.map(message => ({ id }));`,
        expected: `messages.map(message => ({ id: session.userId }));`
      },
      {
        description: "renamed, cursor on value",
        code: `const { userId: i[cursor]d } = session;
messages.map(message => ({ id }));`,
        expected: `messages.map(message => ({ id: session.userId }));`
      },
      {
        description: "from a this expression",
        code: `const { [cursor]userId } = this.session;
messages.map(message => ({ userId }));`,
        expected: `messages.map(message => ({ userId: this.session.userId }));`
      },
      {
        description: "not assigned to another object",
        code: `const { u[cursor]serId } = session;
console.log(userId);`,
        expected: `console.log(session.userId);`
      },
      {
        description: "init being a member expression",
        code: `const { i[cursor]d } = session.user;
console.log(id);`,
        expected: `console.log(session.user.id);`
      },
      {
        description: "init being a member expression with a numeric literal",
        code: `const { i[cursor]d } = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0].id);`
      },
      {
        description: "init being a member expression with a string literal",
        code: `const { i[cursor]d } = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"].id);`
      },
      {
        description:
          "init being a member expression with a computed identifier",
        code: `const { i[cursor]d } = session.users[key];
console.log(id);`,
        expected: `console.log(session.users[key].id);`
      },
      {
        description:
          "init being a member expression with a computed identifier from a call expression",
        code: `const { test[cursor] } = a[b()];
const test2 = test;`,
        expected: `const test2 = a[b()].test;`
      },
      {
        description: "nested",
        code: `const { user: { i[cursor]d } } = session;
console.log(id);`,
        expected: `console.log(session.user.id);`
      },
      {
        description: "nested, init being a member expression",
        code: `const { user: { data: { n: f[cursor]irstName} } } = session.data[0];
console.log(firstName);`,
        expected: `console.log(session.data[0].user.data.n);`
      },
      {
        description: "multi-line",
        code: `const {
  user: {
    [cursor]n: name
  }
} = session;
console.log(name);`,
        expected: `console.log(session.user.n);`
      },
      {
        description: "in a multiple declaration",
        code: `const name = "John", { u[cursor]serId } = session, age = 12;
console.log(userId);`,
        expected: `const name = "John", age = 12;
console.log(session.userId);`
      },
      {
        description: "with other elements destructured, before",
        code: `const { user: { id, n[cursor]ame } } = session;
console.log(name);`,
        expected: `const { user: { id } } = session;
console.log(session.user.name);`
      },
      {
        description: "with other elements destructured, after",
        code: `const { user: { i[cursor]d, name } } = session;
console.log(id);`,
        expected: `const { user: { name } } = session;
console.log(session.user.id);`
      },
      {
        description: "with other elements destructured, before & after",
        code: `const { user: { id, n[cursor]ame, age }, date } = session;
console.log(name);`,
        expected: `const { user: { id, age }, date } = session;
console.log(session.user.name);`
      },
      {
        description: "with other elements destructured, multi-lines",
        code: `const {
  user: {
    id,
    [cursor]n: name,
    age
  },
  date
} = session,
  lastName = "Smith";
console.log(name);`,
        expected: `const {
  user: {
    id,
    age
  },
  date
} = session,
  lastName = "Smith";
console.log(session.user.n);`
      },
      {
        description: "with rest element",
        code: `const { u[cursor]ser, ...others } = session;
console.log(user);`,
        expected: `const { user, ...others } = session;
console.log(session.user);`
      },
      {
        description: "with rest element and nesting",
        code: `const { user: { data: { na[cursor]me } }, ...others } = session;
console.log(name);`,
        expected: `const { user, ...others } = session;
console.log(session.user.data.name);`
      },
      {
        description: "with rest element not being a direct sibling",
        code: `const { user: { data: { na[cursor]me } }, player, ...others } = session;
console.log(name);`,
        expected: `const { user, player, ...others } = session;
console.log(session.user.data.name);`
      },
      {
        description: "with rest elements at different levels",
        code: `const { user: { data: { na[cursor]me }, ...userData }, player, ...others } = session;
console.log(name);`,
        expected: `const { user: { data, ...userData }, player, ...others } = session;
console.log(session.user.data.name);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await inlineVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should should not inline the destructured variable value",
    [
      {
        description: "selected value is not referenced",
        code: `const { u[cursor]serId } = session;
messages.map(message => ({ name }));`
      },
      {
        description: "many destructured elements selected",
        code: `const { userI[start]d,[end] name } = session;
console.log(userId);`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await inlineVariable(editor);

      expect(editor.code).toBe(originalCode);
    }
  );
});
