import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Object Pattern", () => {
  describe("should inline the destructured variable value", () => {
    it("basic scenario", async () => {
      await shouldInlineVariable({
        code: `const { u[cursor]serId } = session;
messages.map(message => ({ userId }));`,
        expected: `messages.map(message => ({ userId: session.userId }));`
      });
    });

    it("renamed, cursor on key", async () => {
      await shouldInlineVariable({
        code: `const { u[cursor]serId: id } = session;
messages.map(message => ({ id }));`,
        expected: `messages.map(message => ({ id: session.userId }));`
      });
    });

    it("renamed, cursor on value", async () => {
      await shouldInlineVariable({
        code: `const { userId: i[cursor]d } = session;
messages.map(message => ({ id }));`,
        expected: `messages.map(message => ({ id: session.userId }));`
      });
    });

    it("from a this expression", async () => {
      await shouldInlineVariable({
        code: `const { [cursor]userId } = this.session;
messages.map(message => ({ userId }));`,
        expected: `messages.map(message => ({ userId: this.session.userId }));`
      });
    });

    it("not assigned to another object", async () => {
      await shouldInlineVariable({
        code: `const { u[cursor]serId } = session;
console.log(userId);`,
        expected: `console.log(session.userId);`
      });
    });

    it("init being a member expression", async () => {
      await shouldInlineVariable({
        code: `const { i[cursor]d } = session.user;
console.log(id);`,
        expected: `console.log(session.user.id);`
      });
    });

    it("init being a member expression with a numeric literal", async () => {
      await shouldInlineVariable({
        code: `const { i[cursor]d } = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0].id);`
      });
    });

    it("init being a member expression with a string literal", async () => {
      await shouldInlineVariable({
        code: `const { i[cursor]d } = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"].id);`
      });
    });

    it("init being a member expression with a computed identifier", async () => {
      await shouldInlineVariable({
        code: `const { i[cursor]d } = session.users[key];
console.log(id);`,
        expected: `console.log(session.users[key].id);`
      });
    });

    it("init being a member expression with a computed identifier from a call expression", async () => {
      await shouldInlineVariable({
        code: `const { test[cursor] } = a[b()];
const test2 = test;`,
        expected: `const test2 = a[b()].test;`
      });
    });

    it("nested", async () => {
      await shouldInlineVariable({
        code: `const { user: { i[cursor]d } } = session;
console.log(id);`,
        expected: `console.log(session.user.id);`
      });
    });

    it("nested, init being a member expression", async () => {
      await shouldInlineVariable({
        code: `const { user: { data: { n: f[cursor]irstName} } } = session.data[0];
console.log(firstName);`,
        expected: `console.log(session.data[0].user.data.n);`
      });
    });

    it("multi-line", async () => {
      await shouldInlineVariable({
        code: `const {
  user: {
    [cursor]n: name
  }
} = session;
console.log(name);`,
        expected: `console.log(session.user.n);`
      });
    });

    it("in a multiple declaration", async () => {
      await shouldInlineVariable({
        code: `const name = "John", { u[cursor]serId } = session, age = 12;
console.log(userId);`,
        expected: `const name = "John", age = 12;
console.log(session.userId);`
      });
    });

    it("with other elements destructured, before", async () => {
      await shouldInlineVariable({
        code: `const { user: { id, n[cursor]ame } } = session;
console.log(name);`,
        expected: `const { user: { id } } = session;
console.log(session.user.name);`
      });
    });

    it("with other elements destructured, after", async () => {
      await shouldInlineVariable({
        code: `const { user: { i[cursor]d, name } } = session;
console.log(id);`,
        expected: `const { user: { name } } = session;
console.log(session.user.id);`
      });
    });

    it("with other elements destructured, before & after", async () => {
      await shouldInlineVariable({
        code: `const { user: { id, n[cursor]ame, age }, date } = session;
console.log(name);`,
        expected: `const { user: { id, age }, date } = session;
console.log(session.user.name);`
      });
    });

    it("with other elements destructured, multi-lines", async () => {
      await shouldInlineVariable({
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
      });
    });

    it("with rest element", async () => {
      await shouldInlineVariable({
        code: `const { u[cursor]ser, ...others } = session;
console.log(user);`,
        expected: `const { user, ...others } = session;
console.log(session.user);`
      });
    });

    it("with rest element and nesting", async () => {
      await shouldInlineVariable({
        code: `const { user: { data: { na[cursor]me } }, ...others } = session;
console.log(name);`,
        expected: `const { user, ...others } = session;
console.log(session.user.data.name);`
      });
    });

    it("with rest element not being a direct sibling", async () => {
      await shouldInlineVariable({
        code: `const { user: { data: { na[cursor]me } }, player, ...others } = session;
console.log(name);`,
        expected: `const { user, player, ...others } = session;
console.log(session.user.data.name);`
      });
    });

    it("with rest elements at different levels", async () => {
      await shouldInlineVariable({
        code: `const { user: { data: { na[cursor]me }, ...userData }, player, ...others } = session;
console.log(name);`,
        expected: `const { user: { data, ...userData }, player, ...others } = session;
console.log(session.user.data.name);`
      });
    });
  });

  describe("should should not inline the destructured variable value", () => {
    it("selected value is not referenced", () => {
      shouldNotInlineVariable({
        code: `const { u[cursor]serId } = session;
messages.map(message => ({ name }));`,
        expectedError: "identifiers to inline"
      });
    });

    it("many destructured elements selected", () => {
      shouldNotInlineVariable({
        code: `const { userI[start]d,[end] name } = session;
console.log(userId);`,
        expectedError: "inlinable code"
      });
    });
  });
});

async function shouldInlineVariable({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = inlineVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  if (result.action !== "read then write") {
    throw new Error(`Expected "read then write" but got "${result.action}"`);
  }

  await editor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(editor.code).toBe(expected);
}

function shouldNotInlineVariable({
  code,
  expectedError
}: {
  code: Code;
  expectedError: string;
}) {
  const editor = new InMemoryEditor(code);
  const result = inlineVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  if (result.action !== "show error") {
    throw new Error(`Expected "show error" but got "${result.action}"`);
  }

  expect(result.reason).toContain(expectedError);
}
