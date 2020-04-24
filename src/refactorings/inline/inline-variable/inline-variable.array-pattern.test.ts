import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Array Pattern", () => {
  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should inline the destructured variable value",
    [
      {
        description: "basic scenario",
        code: `const [ userId ] = session;
console.log(userId);`,
        expected: `console.log(session[0]);`
      },
      {
        description: "init being a member expression",
        code: `const [ id ] = session.user;
console.log(id);`,
        expected: `console.log(session.user[0]);`
      },
      {
        description: "init being a member expression with a numeric literal",
        code: `const [ id ] = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0][0]);`
      },
      {
        description: "init being a member expression with a string literal",
        code: `const [ id ] = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"][0]);`
      },
      {
        description: "nested",
        code: `const [ [ id ] ] = session;
console.log(id);`,
        selection: Selection.cursorAt(0, 11),
        expected: `console.log(session[0][0]);`
      },
      {
        description: "multi-line",
        code: `const [
  [
    name
  ]
] = session;
console.log(name);`,
        selection: Selection.cursorAt(2, 4),
        expected: `console.log(session[0][0]);`
      },
      {
        description: "with other elements destructured, before",
        code: `const [ userId, firstName ] = session;
console.log(userId, firstName);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const [ userId ] = session;
console.log(userId, session[1]);`
      },
      {
        description: "with other elements destructured, after",
        code: `const [ userId, firstName ] = session;
console.log(userId, firstName);`,
        selection: Selection.cursorAt(0, 8),
        expected: `const [ , firstName ] = session;
console.log(session[0], firstName);`
      },
      {
        description: "with other elements destructured, before & after",
        code: `const [ userId, firstName, lastName ] = session;
console.log(userId, firstName);`,
        selection: Selection.cursorAt(0, 17),
        expected: `const [ userId, , lastName ] = session;
console.log(userId, session[1]);`
      },
      {
        description: "with other elements destructured, multi-lines",
        code: `const [
  userId,
  [
    firstName,
    lastName
  ],
  age
] = session;
console.log(userId, firstName);`,
        selection: Selection.cursorAt(3, 4),
        expected: `const [
  userId,
  [
    ,
    lastName
  ],
  age
] = session;
console.log(userId, session[1][0]);`
      },
      {
        description: "in a multiple declaration",
        code: `const name = "John", [ userId ] = session, age = 12;
console.log(userId);`,
        selection: Selection.cursorAt(0, 24),
        expected: `const name = "John", age = 12;
console.log(session[0]);`
      },
      {
        description: "with rest element",
        code: `const [ user, ...others ] = session;
console.log(user);`,
        expected: `const [ , ...others ] = session;
console.log(session[0]);`
      },
      {
        description: "with rest element and nesting",
        code: `const [ [ [ name ] ], ...others ] = session;
console.log(name);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const [ , ...others ] = session;
console.log(session[0][0][0]);`
      },
      {
        description: "with rest element not being a direct sibling",
        code: `const [ [ [ name ] ], player, ...others ] = session;
console.log(name);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const [ , player, ...others ] = session;
console.log(session[0][0][0]);`
      },
      {
        description: "with rest elements at different levels",
        code: `const [ [ [ name ], ...userData ], player, ...others ] = session;
console.log(name);`,
        selection: Selection.cursorAt(0, 12),
        expected: `const [ [ , ...userData ], player, ...others ] = session;
console.log(session[0][0][0]);`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 9), expected }) => {
      const result = await doInlineVariable(code, selection);
      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should should not inline the destructured variable value",
    [
      {
        description: "selected value is not referenced",
        code: `const [ userId ] = session;
messages.map(message => ({ name }));`
      },
      {
        description: "many destructured elements selected",
        code: `const [ userId, name ] = session;
console.log(userId);`,
        selection: new Selection([0, 13], [0, 15])
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 9) }) => {
      const result = await doInlineVariable(code, selection);
      expect(result).toBe(code);
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
