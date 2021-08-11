import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { turnIntoGetter } from "./turn-into-getter";

describe("Turn Into Getter", () => {
  testEach<{ code: Code; expected: Code }>(
    "should turn into getter",
    [
      {
        description: "a getter-like method",
        code: `class Person {
  myName[cursor]() {
    return "Alice";
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.myName() + this.lastName())
  }
}`,
        expected: `class Person {
  get myName() {
    return "Alice";
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.myName + this.lastName())
  }
}`
      },
      {
        description: "a method that starts with `get`",
        code: `class Person {
  getMyName[cursor]() {
    return "Alice";
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.getMyName() + this.lastName())
  }
}`,
        expected: `class Person {
  get myName() {
    return "Alice";
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.myName + this.lastName())
  }
}`
      },
      {
        description:
          "a method that starts with `get`, but new name would conflict",
        code: `class Person {
  myName = "Alice";

  getMyName[cursor]() {
    return this.myName;
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.getMyName() + this.lastName())
  }
}`,
        expected: `class Person {
  myName = "Alice";

  get getMyName() {
    return this.myName;
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.getMyName + this.lastName())
  }
}`
      },
      {
        description: "a method that have all paths returning a value",
        code: `class Person {
  myName[cursor]() {
    if (this.isHappy) {
      return "Al'";
    } else {
      return "Alice";
    }
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.myName() + this.lastName())
  }
}`,
        expected: `class Person {
  get myName() {
    if (this.isHappy) {
      return "Al'";
    } else {
      return "Alice";
    }
  }

  sayHelloTo(other) {
    console.log("Hey " + other.name + ", my name is " + this.myName + this.lastName())
  }
}`
      },
      {
        description: "a method that is called on instances",
        only: true,
        code: `class Person {
  myName[cursor]() {
    return "Alice";
  }
}

const aPerson = new Person();
console.log(aPerson.myName());`,
        expected: `class Person {
  get myName() {
    return "Alice";
  }
}

const aPerson = new Person();
console.log(aPerson.myName);`
      }
      // TODO: usage outside of class (client code)
      // TODO: usage in different file (exported class) -- ouch…
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await turnIntoGetter(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not turn into getter",
    [
      {
        description: "a method with a param",
        code: `class Person {
  myName[cursor](prefix) {
    return prefix + "Alice";
  }
}`
      },
      {
        description: "an async method",
        code: `class Person {
  async myName[cursor]() {
    return "Alice";
  }
}`
      },
      {
        description: "a static method",
        code: `class Person {
  static myName[cursor]() {
    return "Alice";
  }
}`
      },
      {
        description: "a method that has no returned value",
        code: `class Person {
  myName[cursor]() {
    this.say("Alice");
  }
}`
      },
      {
        description: "a method that doesn't have all paths returning a value",
        code: `class Person {
  myName[cursor]() {
    if (this.isHappy) {
      return "Alice";
    }
  }
}`
      },
      {
        description: "a getter",
        code: `class Person {
  get myName[cursor]() {
    return "Alice";
  }
}`
      },
      {
        description: "a computed method",
        code: `class Person {
  ["myName"][cursor]() {
    return "Alice";
  }
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await turnIntoGetter(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await turnIntoGetter(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindMethodToConvert
    );
  });
});
