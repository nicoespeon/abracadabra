import { ErrorReason, Code, RelativePath } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { moveToExistingFile } from "./move-to-existing-file";

describe("Move To Existing File", () => {
  testEach<{
    setup: { currentFile: Code; otherFile: Code; path: RelativePath };
    expected: { currentFile: Code; otherFile: Code };
  }>(
    "should move to existing file",
    [
      {
        description: "a root-level function declaration",
        setup: {
          currentFile: `import { someValue } from "lib";

function [cursor]doNothing() {}

doNothing();`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { doNothing } from "./other-file";
import { someValue } from "lib";

doNothing();`,
          otherFile: `export function doNothing() {}`
        }
      },
      {
        description: "a root-level function declaration, with params",
        setup: {
          currentFile: `function [cursor]sayHello(name) {
  console.log("Hello " + name);
}

sayHello("Jane");`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { sayHello } from "./other-file";

sayHello("Jane");`,
          otherFile: `export function sayHello(name) {
  console.log("Hello " + name);
}`
        }
      },
      {
        description: "in another file with exports already",
        setup: {
          currentFile: `function [cursor]doNothing() {}
doNothing();`,
          otherFile: `function doSomething() {}

export { doSomething }`,
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { doNothing } from "./other-file";
doNothing();`,
          otherFile: `function doSomething() {}

export { doSomething }
export function doNothing() {}`
        }
      },
      {
        description: "with existing import from other file",
        setup: {
          currentFile: `import { doSomething } from "./other-file";

function [cursor]doNothing() {}
doNothing();`,
          otherFile: `export function doSomething() {}`,
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { doSomething, doNothing } from "./other-file";

doNothing();`,
          otherFile: `export function doSomething() {}
export function doNothing() {}`
        }
      },
      {
        description: "with existing default import from other file",
        setup: {
          currentFile: `import otherFile from "./other-file";

function [cursor]doNothing() {}
doNothing();`,
          otherFile: `export function doSomething() {}`,
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import otherFile, { doNothing } from "./other-file";

doNothing();`,
          otherFile: `export function doSomething() {}
export function doNothing() {}`
        }
      },
      {
        description: "with imported references",
        setup: {
          currentFile: `import { HELLO, WORLD } from "../constants";

function [cursor]sayHello() {
  console.log(HELLO, WORLD);
}

sayHello();`,
          otherFile: `import { GOODBYE } from "../../constants";`,
          path: new RelativePath("./nested/other-file.ts")
        },
        expected: {
          currentFile: `import { sayHello } from "./nested/other-file";
import { HELLO, WORLD } from "../constants";

sayHello();`,
          otherFile: `import { GOODBYE, HELLO, WORLD } from "../../constants";

export function sayHello() {
  console.log(HELLO, WORLD);
}`
        }
      },
      {
        description: "a type alias",
        setup: {
          currentFile: `type [cursor]SomeType = string;

const someValue: SomeType = "irrelevant";`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { SomeType } from "./other-file";

const someValue: SomeType = "irrelevant";`,
          otherFile: `export type SomeType = string;`
        }
      },
      {
        description: "a type alias referring to others",
        setup: {
          currentFile: `import { OtherType } from "../some-file";

type [cursor]SomeType = OtherType | string;

const someValue: SomeType = "irrelevant";`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { SomeType } from "./other-file";
import { OtherType } from "../some-file";

const someValue: SomeType = "irrelevant";`,
          otherFile: `import { OtherType } from "../some-file";
export type SomeType = OtherType | string;`
        }
      },
      {
        description: "an interface",
        setup: {
          currentFile: `interface [cursor]Data {
  value: string;
}

let someData: Data;`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { Data } from "./other-file";

let someData: Data;`,
          otherFile: `export interface Data {
  value: string;
}`
        }
      },
      {
        description: "an interface referring to others",
        setup: {
          currentFile: `import { Value } from "../some-file";

interface [cursor]Data {
  response: {
    value: Value;
  };
}

let someData: Data;`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { Data } from "./other-file";
import { Value } from "../some-file";

let someData: Data;`,
          otherFile: `import { Value } from "../some-file";

export interface Data {
  response: {
    value: Value;
  };
}`
        }
      },
      {
        description: "an exported function (preserve the export)",
        setup: {
          currentFile: `export function [cursor]sayHello() {
  console.log("hello");
}

sayHello();`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { sayHello } from "./other-file";
export { sayHello };

sayHello();`,
          otherFile: `export function sayHello() {
  console.log("hello");
}`
        }
      },
      {
        description: "an exported interface",
        setup: {
          currentFile: `export interface [cursor]Data {
  value: string;
}

let someData: Data;`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { Data } from "./other-file";
export type { Data };

let someData: Data;`,
          otherFile: `export interface Data {
  value: string;
}`
        }
      },
      {
        description: "an exported type",
        setup: {
          currentFile: `export type [cursor]Data = {
  value: string;
};

let someData: Data;`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { Data } from "./other-file";
export type { Data };

let someData: Data;`,
          otherFile: `export type Data = {
  value: string;
};`
        }
      },
      {
        description: "an exported function (default export)",
        setup: {
          currentFile: `export default function [cursor]sayHello() {
  console.log("hello");
}

sayHello();`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { sayHello } from "./other-file";
export default sayHello;

sayHello();`,
          otherFile: `export function sayHello() {
  console.log("hello");
}`
        }
      },
      {
        description: "an exported interface (default export)",
        setup: {
          currentFile: `export default interface [cursor]Data {
  value: string;
}

let someData: Data;`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { Data } from "./other-file";
export default Data;

let someData: Data;`,
          otherFile: `export interface Data {
  value: string;
}`
        }
      },
      {
        description: "a root-level variable declaration",
        setup: {
          currentFile: `import { someValue } from "lib";

const [cursor]level = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

console.log(level.LOW);`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { level } from "./other-file";
import { someValue } from "lib";

console.log(level.LOW);`,
          otherFile: `export const level = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};`
        }
      },
      {
        description: "a root-level variable declaration (let)",
        setup: {
          currentFile: `import { someValue } from "lib";

let [cursor]level = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

console.log(level.LOW);`,
          otherFile: "",
          path: new RelativePath("./other-file.ts")
        },
        expected: {
          currentFile: `import { level } from "./other-file";
import { someValue } from "lib";

console.log(level.LOW);`,
          otherFile: `export let level = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};`
        }
      }
    ],
    async ({ setup, expected }) => {
      const editor = new InMemoryEditor(setup.currentFile);
      editor.writeIn(setup.path, setup.otherFile);

      await moveToExistingFile(editor);

      expect(editor.code).toBe(expected.currentFile);
      const otherFileCode = await editor.codeOf(setup.path);
      expect(otherFileCode).toBe(expected.otherFile);
    }
  );

  testEach<{ code: Code }>(
    "should not move",
    [
      {
        description: "if cursor is inside function body",
        code: `function sayHello() {[cursor]
  console.log("hello");
}

sayHello();`
      },
      {
        description: "a nested function declaration",
        code: `function doSomething() {
  function [cursor]doNothing() {}

  doNothing();
}`
      },
      {
        description:
          "a function declaration with references defined in the same file",
        code: `import importedReferenceIsFine from "./other-file";

const someVariable = "world";

function [cursor]doSomething() {
  console.log("This is fine, it's a global");
  importedReferenceIsFine();

  referencedHere(someVariable);
}

function referencedHere() {}`
      },
      {
        description: "a type alias with references defined in the same file",
        code: `type [cursor]SomeType = OtherType | string;
type OtherType = string;`
      },
      {
        description: "an interface with references defined in the same file",
        code: `interface [cursor]Data {
  value: Value;
}

type Value = string;`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;
      const otherFile = new RelativePath("./other-file.ts");
      editor.writeIn(otherFile, "// No change expected");

      await moveToExistingFile(editor);

      expect(editor.code).toBe(originalCode);
      const otherFileCode = await editor.codeOf(otherFile);
      expect(otherFileCode).toBe("// No change expected");
    }
  );

  it("should ask user to select among other files", async () => {
    const code = `function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    editor.writeIn(new RelativePath("./some-other-file.ts"), "");
    editor.writeIn(new RelativePath("./yet-another-file.js"), "");
    editor.writeIn(new RelativePath("../../another-react-file.tsx"), "");
    editor.writeIn(new RelativePath("./yet-another-react-file.jsx"), "");
    jest.spyOn(editor, "askUserChoice");

    await moveToExistingFile(editor);

    expect(editor.askUserChoice).toBeCalledWith(
      [
        expect.objectContaining({ label: "some-other-file.ts" }),
        expect.objectContaining({ label: "yet-another-file.js" }),
        expect.objectContaining({ label: "another-react-file.tsx" }),
        expect.objectContaining({ label: "yet-another-react-file.jsx" })
      ],
      "Search files by name and pick one"
    );
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    editor.writeIn(new RelativePath("./some-other-file.ts"), "");
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindCodeToMove);
  });

  it("should show an error message if there's no other file in the workspace", async () => {
    const code = `function [cursor]doSomething() {}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await moveToExistingFile(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindOtherFiles);
  });
});
