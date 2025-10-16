import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { convertToArrowFunction } from "./convert-to-arrow-function";

describe("Convert To Arrow Function", () => {
  describe("should convert function declaration to arrow function", () => {
    it("non-generic", () => {
      shouldConvertToArrowFunction({
        code: `function fn(a: string): number { return 1; }`,
        expected: `const fn = (a: string): number => { return 1; };`
      });
    });

    it("non-generic async", () => {
      shouldConvertToArrowFunction({
        code: `async function fn(a: string): number { return 1; }`,
        expected: `const fn = async (a: string): number => { return 1; };`
      });
    });

    it("generic", () => {
      shouldConvertToArrowFunction({
        code: `function fn<T>(t: T): T { return t; }`,
        expected: `const fn = <T>(t: T): T => { return t; };`
      });
    });

    it("generic async", () => {
      shouldConvertToArrowFunction({
        code: `async function fn<T>(t: T): T { return t; }`,
        expected: `const fn = async <T>(t: T): T => { return t; };`
      });
    });

    it("preserves leading comment", () => {
      shouldConvertToArrowFunction({
        code: `// This is a comment.

[cursor]function test() {}`,
        expected: `// This is a comment.

const test = () => {};`
      });
    });

    it("preserves inner comment", () => {
      shouldConvertToArrowFunction({
        code: `function test() {
  // This is a comment.
}`,
        expected: `const test = () => {
  // This is a comment.
};`
      });
    });

    it("preserves trailing comment", () => {
      shouldConvertToArrowFunction({
        code: `function test() {} // This is a comment.`,
        expected: `const test = () => {}; // This is a comment.`
      });
    });

    it("with an interpreter directive", () => {
      shouldConvertToArrowFunction({
        code: `#!/usr/bin/env node

[cursor]function test() {}`,
        expected: `#!/usr/bin/env node

const test = () => {};`
      });
    });

    it("nested, cursor on outer function", () => {
      shouldConvertToArrowFunction({
        code: `function outer[cursor]() {
  function inner() {
    return null
  }
}`,
        expected: `const outer = () => {
  function inner() {
    return null
  }
};`
      });
    });

    it("nested, cursor on inner function", () => {
      shouldConvertToArrowFunction({
        code: `function outer() {
  function [cursor]inner() {
    return null
  }
}`,
        expected: `function outer() {
  const inner = () => {
    return null
  };
}`
      });
    });

    it("with reference after declaration", () => {
      shouldConvertToArrowFunction({
        code: `function [cursor]doSomething() {}

doSomething();`,
        expected: `const doSomething = () => {};

doSomething();`
      });
    });

    it("with imported type referenced in another function", () => {
      shouldConvertToArrowFunction({
        code: `import { Input } from "./types";

function checkAnswer(input: Input) {}

function [cursor]doNothing() {}`,
        expected: `import { Input } from "./types";

function checkAnswer(input: Input) {}

const doNothing = () => {};`
      });
    });

    it("an exported function expression", () => {
      shouldConvertToArrowFunction({
        code: `export function [cursor]sayHello(name: string) {
  console.log(\`Well, hello here \${name} 👋\`);
}`,
        expected: `export const sayHello = (name: string) => {
  console.log(\`Well, hello here \${name} 👋\`);
};`
      });
    });

    it("a default exported function expression", () => {
      shouldConvertToArrowFunction({
        code: `export default function [cursor]sayHello(name: string) {
  console.log(\`Well, hello here \${name} 👋\`);
}`,
        expected: `const sayHello = (name: string) => {
  console.log(\`Well, hello here \${name} 👋\`);
};

export default sayHello;`
      });
    });

    it("a function expression that's an argument to a call expression", () => {
      shouldConvertToArrowFunction({
        code: `doThis(function[cursor] () {});`,
        expected: `doThis(() => {});`
      });
    });

    it("function declarations above, but no reference", () => {
      shouldConvertToArrowFunction({
        code: `function say(message) {
  logger.log(">", message);
}

function sayGoodMorning() {
  say("Good Morning");
}

function [cursor]sum(x) {
  return x + 1;
}`,
        expected: `function say(message) {
  logger.log(">", message);
}

function sayGoodMorning() {
  say("Good Morning");
}

const sum = x => {
  return x + 1;
};`
      });
    });

    it("reference that's above function, but deferred", () => {
      shouldConvertToArrowFunction({
        code: `function main() {
  for (const [id, path] of scripts) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }

  function run[cursor](path) {}
}`,
        expected: `function main() {
  for (const [id, path] of scripts) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }

  const run = path => {};
}`
      });
    });

    it("reference that's above function, but deferred (object method)", () => {
      shouldConvertToArrowFunction({
        code: `const obj = {
  runOnId(id, path) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }
};

function run[cursor](path) {}`,
        expected: `const obj = {
  runOnId(id, path) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }
};

const run = path => {};`
      });
    });

    it("reference that's above function, but deferred (class method)", () => {
      shouldConvertToArrowFunction({
        code: `class Something {
  runOnId(id, path) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }
}

function run[cursor](path) {}`,
        expected: `class Something {
  runOnId(id, path) {
    document.querySelector(id).addEventListener('click', () => run(path));
  }
}

const run = path => {};`
      });
    });
  });

  it("should show an error message if there's a reference before declaration", () => {
    const code = `doSomething();

function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    const result = convertToArrowFunction({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = convertToArrowFunction({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });

  it("should not refactor if cursor is inside function body", () => {
    shouldNotConvert(`function dontConvertMe() {
  // Some code[cursor]
}`);
  });
});

function shouldConvertToArrowFunction({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = convertToArrowFunction({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotConvert(code: Code) {
  const editor = new InMemoryEditor(code);
  const result = convertToArrowFunction({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
