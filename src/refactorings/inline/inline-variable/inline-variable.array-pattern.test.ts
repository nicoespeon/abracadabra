import { Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { inlineVariable } from "./inline-variable";

describe("Inline Variable - Array Pattern", () => {
  testEach<{ code: Code; expected: Code }>(
    "should inline the destructured variable value",
    [
      {
        description: "basic scenario",
        code: `const [ u[cursor]serId ] = session;
console.log(userId);`,
        expected: `console.log(session[0]);`
      },
      {
        description: "init being a member expression",
        code: `const [ i[cursor]d ] = session.user;
console.log(id);`,
        expected: `console.log(session.user[0]);`
      },
      {
        description: "init being a member expression with a numeric literal",
        code: `const [ i[cursor]d ] = session.users[0];
console.log(id);`,
        expected: `console.log(session.users[0][0]);`
      },
      {
        description: "init being a member expression with a string literal",
        code: `const [ i[cursor]d ] = session.users["first"];
console.log(id);`,
        expected: `console.log(session.users["first"][0]);`
      },
      {
        description: "nested",
        code: `const [ [ i[cursor]d ] ] = session;
console.log(id);`,
        expected: `console.log(session[0][0]);`
      },
      {
        description: "multi-line",
        code: `const [
  [
    [cursor]name
  ]
] = session;
console.log(name);`,
        expected: `console.log(session[0][0]);`
      },
      {
        description: "with other elements destructured, before",
        code: `const [ userId, f[cursor]irstName ] = session;
console.log(userId, firstName);`,
        expected: `const [ userId ] = session;
console.log(userId, session[1]);`
      },
      {
        description: "with other elements destructured, after",
        code: `const [ [cursor]userId, firstName ] = session;
console.log(userId, firstName);`,
        expected: `const [ , firstName ] = session;
console.log(session[0], firstName);`
      },
      {
        description: "with other elements destructured, before & after",
        code: `const [ userId, f[cursor]irstName, lastName ] = session;
console.log(userId, firstName);`,
        expected: `const [ userId, , lastName ] = session;
console.log(userId, session[1]);`
      },
      {
        description: "with other elements destructured, multi-lines",
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
      },
      {
        description: "in a multiple declaration",
        code: `const name = "John", [ u[cursor]serId ] = session, age = 12;
console.log(userId);`,
        expected: `const name = "John", age = 12;
console.log(session[0]);`
      },
      {
        description: "with rest element",
        code: `const [ u[cursor]ser, ...others ] = session;
console.log(user);`,
        expected: `const [ , ...others ] = session;
console.log(session[0]);`
      },
      {
        description: "with rest element and nesting",
        code: `const [ [ [ [cursor]name ] ], ...others ] = session;
console.log(name);`,
        expected: `const [ , ...others ] = session;
console.log(session[0][0][0]);`
      },
      {
        description: "with rest element not being a direct sibling",
        code: `const [ [ [ [cursor]name ] ], player, ...others ] = session;
console.log(name);`,
        expected: `const [ , player, ...others ] = session;
console.log(session[0][0][0]);`
      },
      {
        description: "with rest elements at different levels",
        code: `const [ [ [ [cursor]name ], ...userData ], player, ...others ] = session;
console.log(name);`,
        expected: `const [ [ , ...userData ], player, ...others ] = session;
console.log(session[0][0][0]);`
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
        code: `const [ u[cursor]serId ] = session;
messages.map(message => ({ name }));`
      },
      {
        description: "many destructured elements selected",
        code: `const [ userI[start]d,[end] name ] = session;
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
