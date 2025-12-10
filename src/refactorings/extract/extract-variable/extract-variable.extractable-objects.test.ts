import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Objects we can extract", () => {
  describe("should extract", () => {
    it("an object", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]{ one: 1, foo: true, hello: 'World!' });`,
        expected: `const extracted = { one: 1, foo: true, hello: 'World!' };
console.log(extracted);`
      });
    });

    it("an object (multi-lines)", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]{
  one: 1,
  foo: true,
  hello: 'World!'
});`,
        expected: `const extracted = {
  one: 1,
  foo: true,
  hello: 'World!'
};
console.log(extracted);`
      });
    });

    it("a multi-lines object when cursor is inside", async () => {
      await shouldExtractVariable({
        code: `console.log({
  one: 1,
  f[cursor]oo: true,
  hello: 'World!'
});`,
        expected: `const extracted = {
  one: 1,
  foo: true,
  hello: 'World!'
};
console.log(extracted);`
      });
    });

    it("an element nested in a multi-lines object", async () => {
      await shouldExtractVariable({
        code: `console.log({
  one: 1,
  foo: {
    bar: [cursor]"Hello!"
  }
});`,
        expected: `const bar = "Hello!";
console.log({
  one: 1,
  foo: {
    bar
  }
});`
      });
    });

    it("an object property value (not the last one)", async () => {
      await shouldExtractVariable({
        code: `console.log({
  hello: [cursor]"World",
  goodbye: "my old friend"
});`,
        expected: `const hello = "World";
console.log({
  hello[cursor],
  goodbye: "my old friend"
});`
      });
    });

    it("an object property value which key is not in camel case", async () => {
      await shouldExtractVariable({
        code: `console.log({
  hello_world: "[cursor]World",
  goodbye: "my old friend"
});`,
        expected: `const hello_world = "World";
console.log({
  hello_world,
  goodbye: "my old friend"
});`
      });
    });

    it("an object property value which key is too long", async () => {
      await shouldExtractVariable({
        code: `console.log({
  somethingVeryVeryVeryLong: doSo[cursor]mething()
});`,
        expected: `const somethingVeryVeryVeryLong = doSomething();
console.log({
  somethingVeryVeryVeryLong
});`
      });
    });

    it("an object property value which key is a keyword", async () => {
      await shouldExtractVariable({
        code: `console.log({
  const: doS[cursor]omething()
});`,
        expected: `const extracted = doSomething();
console.log({
  const: extracted
});`
      });
    });

    it("an object property value which key is a string", async () => {
      await shouldExtractVariable({
        code: `console.log({
  "hello.world": d[cursor]oSomething()
});`,
        expected: `const extracted = doSomething();
console.log({
  "hello.world": extracted
});`
      });
    });

    it("an element nested in a multi-lines object that is assigned to a variable", async () => {
      await shouldExtractVariable({
        code: `const a = {
  one: 1,
  foo: {
    bar: [cursor]"Hello!"
  }
};`,
        expected: `const bar = "Hello!";
const a = {
  one: 1,
  foo: {
    bar
  }
};`
      });
    });

    it("the whole object when cursor is on its property", async () => {
      await shouldExtractVariable({
        code: `console.log({ fo[cursor]o: "bar", one: true });`,
        expected: `const extracted = { foo: "bar", one: true };
console.log(extracted);`
      });
    });

    it("a computed object property", async () => {
      await shouldExtractVariable({
        code: `const a = { [[cursor]key]: "value" };`,
        expected: `const extracted = key;
const a = { [extracted]: "value" };`
      });
    });

    it("a computed object property value when cursor is on value", async () => {
      await shouldExtractVariable({
        code: `const a = { [key]: [cursor]"value" };`,
        expected: `const value = "value";
const a = { [key]: value };`
      });
    });

    it("the whole object when cursor is on a method declaration", async () => {
      await shouldExtractVariable({
        code: `console.log({
  [cursor]getFoo() {
    return "bar";
  }
});`,
        expected: `const extracted = {
  getFoo() {
    return "bar";
  }
};
console.log(extracted);`
      });
    });

    it("the nested object when cursor is on nested object property", async () => {
      await shouldExtractVariable({
        code: `console.log({ foo: { [cursor]bar: true } });`,
        expected: `const foo = { bar: true };
console.log({ foo });`
      });
    });

    it("an object returned from arrow function", async () => {
      await shouldExtractVariable({
        code: `const something = () => ({
  foo: "b[cursor]ar"
});`,
        expected: `const foo = "bar";
const something = () => ({
  foo
});`
      });
    });

    it("an object from a nested call expression", async () => {
      await shouldExtractVariable({
        code: `assert.isTrue(
  getError({ co[cursor]ntext: ["value"] })
);`,
        expected: `const extracted = { context: ["value"] };
assert.isTrue(
  getError(extracted)
);`
      });
    });

    it("a property to destructure", async () => {
      await shouldExtractVariable({
        code: `console.log(foo.bar.b[cursor]az);`,
        expected: `const { baz } = foo.bar;
console.log(baz);`
      });
    });

    it("a property to destructure from an existing assignment, but user decides to preserve", async () => {
      await shouldExtractVariable({
        code: `function test() {
  const { x } = obj;
  return x + obj.y[cursor] * x;
}`,
        shouldPreserve: true,
        expected: `function test() {
  const { x } = obj;
  const y = obj.y;
  return x + [cursor]y * x;
}`
      });
    });

    it("a property using optional chaining", async () => {
      await shouldExtractVariable({
        code: `if (currentUser?.startTime[cursor] > 0) {}`,
        expected: `const startTime = currentUser?.startTime;
if (startTime > 0) {}`
      });
    });

    it("a property using optional chaining, multiple occurrences", async () => {
      await shouldExtractVariable({
        code: `if (currentUser?.startTime[cursor] > 0) {
  console.log(currentUser?.startTime);
}`,
        expected: `const startTime = currentUser?.startTime;
if (startTime > 0) {
  console.log(startTime);
}`
      });
    });
  });

  it("combines destructured properties from an existing assignment (Identifier)", async () => {
    await shouldExtractVariable({
      code: `const { x } = obj;
function someScope() {
function test() {
  return x + obj.y[cursor] * x;
}
}`,
      expected: `const { x, y } = obj;
function someScope() {
function test() {
  return x + [cursor]y * x;
}
}`
    });
  });

  it("combines destructured properties from an existing assignment (MemberExpression)", async () => {
    await shouldExtractVariable({
      code: `const { x } = req.query;
function someScope() {
  function test() {
    return x + req.query.y[cursor] * x;
  }
}`,
      expected: `const { x, y } = req.query;
function someScope() {
  function test() {
    return x + [cursor]y * x;
  }
}`
    });
  });

  it("do not combine destructured properties if existing assignment is in a different scope", async () => {
    await shouldExtractVariable({
      code: `{
  const { x } = obj;
  console.log(x);
}

function test() {
  return obj.y[cursor];
}`,
      expected: `{
  const { x } = obj;
  console.log(x);
}

function test() {
  const { y } = obj;
  return [cursor]y;
}`
    });
  });

  it("should ask if user wants to destructure or not", () => {
    const code = `console.log(foo.bar.b[cursor]az)`;
    const editor = new InMemoryEditor(code);
    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "ask user choice",
      choices: [
        {
          label: "Destructure => `const { baz } = foo.bar`",
          value: "destructure"
        },
        {
          label: "Preserve => `const baz = foo.bar.baz`",
          value: "preserve"
        }
      ]
    });
  });

  it("should not ask to destructure computed member expressions", () => {
    const code = `console.log([start]foo.bar.children[0][end].selection)`;
    const editor = new InMemoryEditor(code);
    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).not.toBe("ask user choice");
  });

  it("should not ask if user wants to destructure if it can't be", () => {
    const code = `console.log([cursor]"hello")`;
    const editor = new InMemoryEditor(code);
    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).not.toBe("ask user choice");
  });

  it("should preserve member expression if user says so", async () => {
    await shouldExtractVariable({
      code: `console.log(foo.bar.b[cursor]az);`,
      expected: `const baz = foo.bar.baz;
console.log(baz);`,
      shouldPreserve: true
    });
  });

  it("should rename the correct identifier for multiple occurrences on the same line", async () => {
    await shouldExtractVariable({
      code: `console.log(data.response.code, data.response[cursor].user.id, data.response.user.name);`,
      expected: `const { response } = data;
console.log(response.code, [cursor]response.user.id, response.user.name);`
    });
  });

  it("should rename the correct identifier for multiple occurrences on the same line (only one occurrence extracted)", async () => {
    await shouldExtractVariable({
      code: `console.log(data.response.code, data.response[cursor].user.id, data.response.user.name);`,
      expected: `const response = data.response;
console.log(data.response.code, [cursor]response.user.id, data.response.user.name);`,
      shouldExtractSingleOccurrence: true
    });
  });

  it("should rename the correct identifier if it's also re-assigned", async () => {
    await shouldExtractVariable({
      code: `query.lang = query.lang[cursor] ? "yes" : "nope";`,
      expected: `const { lang } = query;
query.lang = [cursor]lang ? "yes" : "nope";`
    });
  });

  it("should detect multiple occurrences when extracting a value from an object", () => {
    const code = `const userConfig = {
  apiBaseUrl: 'https://api.example.com',
  apiTimeout: 30000[cursor],
  dbTimeout: 30000,
  cacheTimeout: 30000,
};

const apiTimeout = 30000;`;

    const editor = new InMemoryEditor(code);
    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("ask user choice");
  });

  it("should extract multiple occurrences when extracting a value from an object", async () => {
    await shouldExtractVariable({
      code: `const userConfig = {
  apiBaseUrl: 'https://api.example.com',
  apiTimeout: 30000[cursor],
  dbTimeout: 30000,
  cacheTimeout: 30000,
};

const apiTimeout = 30000;`,
      expected: `const extracted = 30000;
const userConfig = {
  apiBaseUrl: 'https://api.example.com',
  apiTimeout: extracted,
  dbTimeout: extracted,
  cacheTimeout: extracted,
};

const apiTimeout = extracted;`
    });
  });
});

async function shouldExtractVariable({
  code,
  expected,
  shouldPreserve,
  shouldExtractSingleOccurrence
}: {
  code: Code;
  expected: Code;
  shouldPreserve?: boolean;
  shouldExtractSingleOccurrence?: boolean;
}) {
  const editor = new InMemoryEditor(code);
  let result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  const responses: Array<{ id: string; type: "choice"; value: any }> = [];

  // Handle multiple user choices (replacement strategy, then modification details)
  while (result.action === "ask user choice") {
    let choice;

    if (result.id === "user-choice") {
      choice = shouldExtractSingleOccurrence
        ? result.choices.find((c) => c.value === "selected occurrence")
        : result.choices[0];
    } else if (result.id === "modification-details") {
      if (shouldPreserve !== undefined) {
        choice = shouldPreserve
          ? result.choices.find((c) => c.value === "preserve")
          : result.choices.find((c) => c.value === "destructure");
      } else {
        const hasReplacementStrategyResponse = responses.some(
          (r) => r.id === "user-choice"
        );
        const shouldDefaultToPreserve =
          shouldExtractSingleOccurrence && hasReplacementStrategyResponse;
        choice = shouldDefaultToPreserve
          ? result.choices.find((c) => c.value === "preserve")
          : result.choices[0];
      }
    } else {
      throw new Error(`Unexpected choice id: ${result.id}`);
    }

    if (!choice) {
      throw new Error(
        `Could not find choice for id "${result.id}". Available choices: ${JSON.stringify(result.choices)}. shouldExtractSingleOccurrence: ${shouldExtractSingleOccurrence}, shouldPreserve: ${shouldPreserve}`
      );
    }

    responses.push({
      id: result.id,
      type: "choice",
      value: choice
    });

    result = extractVariable({
      state: "with user responses",
      responses,
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });
  }

  if (result.action !== "read then write") {
    throw new Error(`Expected "read then write" but got "${result.action}"`);
  }

  const { code: expectedCode, selection: expectedSelection } =
    new InMemoryEditor(expected);

  const testEditor = new InMemoryEditor(editor.code);
  await testEditor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(testEditor.code).toBe(expectedCode);

  if (!expectedSelection.isCursorAtTopOfDocument) {
    expect(result).toMatchObject({
      newCursorPosition: expectedSelection.start
    });
  }
}
