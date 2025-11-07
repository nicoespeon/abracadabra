import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Array Pattern", () => {
  describe("should inline the destructured variable value", () => {
    it("basic scenario", async () => {
      await shouldInlineVariable({
        code: `const [ u[cursor]serId ] = session;
console.log(userId);`,
        expected: `console.log(session[0]);`
      });
    });

    it("init being a member expression", async () => {
      await shouldInlineVariable({
        code: `const [ i[cursor]d ] = session.user;
console.log(id);`,
        expected: `console.log(session.user[0]);`
      });
    });

    it("init being a member expression with a numeric literal", async () => {
      await shouldInlineVariable({
        code: `const [ i[cursor]d ] = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0][0]);`
      });
    });

    it("init being a member expression with a string literal", async () => {
      await shouldInlineVariable({
        code: `const [ i[cursor]d ] = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"][0]);`
      });
    });

    it("nested", async () => {
      await shouldInlineVariable({
        code: `const [ [ i[cursor]d ] ] = session;
console.log(id);`,
        expected: `console.log(session[0][0]);`
      });
    });

    it("multi-line", async () => {
      await shouldInlineVariable({
        code: `const [
  [
    [cursor]name
  ]
] = session;
console.log(name);`,
        expected: `console.log(session[0][0]);`
      });
    });

    it("with other elements destructured, before", async () => {
      await shouldInlineVariable({
        code: `const [ userId, f[cursor]irstName ] = session;
console.log(userId, firstName);`,
        expected: `const [ userId ] = session;
console.log(userId, session[1]);`
      });
    });

    it("with other elements destructured, after", async () => {
      await shouldInlineVariable({
        code: `const [ [cursor]userId, firstName ] = session;
console.log(userId, firstName);`,
        expected: `const [ , firstName ] = session;
console.log(session[0], firstName);`
      });
    });

    it("with other elements destructured, before & after", async () => {
      await shouldInlineVariable({
        code: `const [ userId, f[cursor]irstName, lastName ] = session;
console.log(userId, firstName);`,
        expected: `const [ userId, , lastName ] = session;
console.log(userId, session[1]);`
      });
    });

    it("with other elements destructured, multi-lines", async () => {
      await shouldInlineVariable({
        code: `const [
  userId,
  [
    [cursor]firstName,
    lastName
  ],
  age
] = session;
console.log(userId, firstName);`,
        expected: `const [
  userId,
  [
    ,
    lastName
  ],
  age
] = session;
console.log(userId, session[1][0]);`
      });
    });

    it("in a multiple declaration", async () => {
      await shouldInlineVariable({
        code: `const name = "John", [ u[cursor]serId ] = session, age = 12;
console.log(userId);`,
        expected: `const name = "John", age = 12;
console.log(session[0]);`
      });
    });

    it("with rest element", async () => {
      await shouldInlineVariable({
        code: `const [ u[cursor]ser, ...others ] = session;
console.log(user);`,
        expected: `const [ , ...others ] = session;
console.log(session[0]);`
      });
    });

    it("with rest element and nesting", async () => {
      await shouldInlineVariable({
        code: `const [ [ [ [cursor]name ] ], ...others ] = session;
console.log(name);`,
        expected: `const [ , ...others ] = session;
console.log(session[0][0][0]);`
      });
    });

    it("with rest element not being a direct sibling", async () => {
      await shouldInlineVariable({
        code: `const [ [ [ [cursor]name ] ], player, ...others ] = session;
console.log(name);`,
        expected: `const [ , player, ...others ] = session;
console.log(session[0][0][0]);`
      });
    });

    it("with rest elements at different levels", async () => {
      await shouldInlineVariable({
        code: `const [ [ [ [cursor]name ], ...userData ], player, ...others ] = session;
console.log(name);`,
        expected: `const [ [ , ...userData ], player, ...others ] = session;
console.log(session[0][0][0]);`
      });
    });
  });

  describe("should should not inline the destructured variable value", () => {
    it("selected value is not referenced", () => {
      shouldNotInlineVariable({
        code: `const [ u[cursor]serId ] = session;
messages.map(message => ({ name }));`,
        expectedError: "identifiers to inline"
      });
    });

    it("many destructured elements selected", () => {
      shouldNotInlineVariable({
        code: `const [ userI[start]d,[end] name ] = session;
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
