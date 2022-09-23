import { Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";

import { extractVariable } from "./extract-variable";
import { ReplacementStrategy } from "../replacement-strategy";
import { testEach } from "../../../tests-helpers";

describe("Extract Variable - Multiple occurrences", () => {
  it("should not ask the user if there is only one occurrence", async () => {
    const code = `console.log("Hel[cursor]lo");`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "askUserChoice");

    await extractVariable(editor);

    expect(editor.askUserChoice).not.toBeCalled();
  });

  it("should ask the user what to replace if there are multiple occurrences", async () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "askUserChoice");

    await extractVariable(editor);

    expect(editor.askUserChoice).toBeCalledWith([
      {
        value: ReplacementStrategy.AllOccurrences,
        label: "Replace all 2 occurrences"
      },
      {
        value: ReplacementStrategy.SelectedOccurrence,
        label: "Replace this occurrence only"
      }
    ]);
  });

  it("should stop extraction if user doesn't select a choice", async () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;
    jest.spyOn(editor, "askUserChoice").mockResolvedValue(undefined);

    await extractVariable(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should extract only selected occurrence if user says so", async () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([_, thisOccurrence]) =>
        Promise.resolve(thisOccurrence)
      );

    await extractVariable(editor);

    const expectedCode = `const hello = "Hello";
console.log(hello);
sendMessage("Hello");`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should extract all occurrences if user says so", async () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `const hello = "Hello";
console.log(hello);
sendMessage(hello);`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should put the extraction above the top most occurrence", async () => {
    const code = `console.log("Hello");
sendMessage("He[cursor]llo");`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `const hello = "Hello";
console.log(hello);
sendMessage(hello);`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should only extract occurrences in the scope of selected one", async () => {
    const code = `function sayHello() {
  track("said", "H[cursor]ello");
  console.log("Hello");
}

sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `function sayHello() {
  const hello = "Hello";
  track("said", hello);
  console.log(hello);
}

sendMessage("Hello");`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should make the extraction in the scope of all occurrences", async () => {
    const code = `function sayHello() {
  if (isValid) {
    track("said", "[cursor]Hello");
  }
  console.log("Hello");
}

sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `function sayHello() {
  const hello = "Hello";
  if (isValid) {
    track("said", hello);
  }
  console.log(hello);
}

sendMessage("Hello");`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should make the extraction in the scope of all occurrences (switch statement)", async () => {
    const code = `function addScore() {
  switch (tempScore) {
    case 0:
      score += [cursor]'Love';
      break;
    case 1:
      score += 'Fifteen';
      break;
    case 2:
      score += 'Love';
      break;
  }
}`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `function addScore() {
  const love = 'Love';
  switch (tempScore) {
    case 0:
      score += love;
      break;
    case 1:
      score += 'Fifteen';
      break;
    case 2:
      score += love;
      break;
  }
}`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should make the extraction in the scope of all occurrences (if statement)", async () => {
    const code = `if (isMorning) {
  console.log("[cursor]hello");
} else {
  console.log("hello");
}`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expectedCode = `const hello = "hello";
if (isMorning) {
  console.log(hello);
} else {
  console.log(hello);
}`;
    expect(editor.code).toBe(expectedCode);
  });

  it("should rename the second occurrence", async () => {
    const code = `function repro(a: { b: { c: string } }, condition: boolean) {
  if (condition) {
    const myVar = a.b().c;
  } else {
    const myVar = [start]a.b()[end].c;
  }
}`;
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUserChoice")
      .mockImplementation(([allOccurrences]) =>
        Promise.resolve(allOccurrences)
      );

    await extractVariable(editor);

    const expected =
      new InMemoryEditor(`function repro(a: { b: { c: string } }, condition: boolean) {
  const extracted = a.b();
  if (condition) {
    const myVar = extracted.c;
  } else {
    const myVar = [cursor]extracted.c;
  }
}`);
    expect(editor.code).toBe(expected.code);
    expect(editor.selection).toStrictEqual(expected.selection);
  });

  testEach<{ code: Code; expected: Code }>(
    "should extract variables of type",
    [
      {
        description: "string",
        code: `console.log([cursor]"Hello");
sendMessage("Hello");`,
        expected: `const hello = "Hello";
console.log(hello);
sendMessage(hello);`
      },
      {
        description: "number",
        code: `console.log([cursor]10);
sendMessage(10);`,
        expected: `const extracted = 10;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "boolean",
        code: `console.log([cursor]true);
sendMessage(true);`,
        expected: `const extracted = true;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "null",
        code: `console.log([cursor]null);
sendMessage(null);`,
        expected: `const extracted = null;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "undefined",
        code: `console.log([cursor]undefined);
sendMessage(undefined);`,
        expected: `const extracted = undefined;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "array",
        code: `console.log([cursor][1, 3, 4]);
sendMessage([1, 3, 4]);`,
        expected: `const extracted = [1, 3, 4];
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "only identical arrays",
        code: `console.log([cursor][1, 3, 4]);
sendMessage([1, 3, 4]);
const dontExtract = [];`,
        expected: `const extracted = [1, 3, 4];
console.log(extracted);
sendMessage(extracted);
const dontExtract = [];`
      },
      {
        description: "object",
        code: `console.log([cursor]{ one: 1, foo: "bar" });
sendMessage({ one: 1, foo: "bar" });`,
        expected: `const extracted = { one: 1, foo: "bar" };
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "object",
        code: `console.log([cursor][
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
]);
sendMessage([
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
]);`,
        expected: `const extracted = [
  {
    one: 1,
    foo: "bar",
    elements: [[1, 2], "hello"]
  }
];
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "arrow function expression",
        code: `console.log([cursor]() => "Hello");
sendMessage(() => "Hello");`,
        expected: `const extracted = () => "Hello";
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "call expression",
        code: `console.log([cursor]sayHello());
sendMessage(sayHello());`,
        expected: `const extracted = sayHello();
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "call expression with arguments",
        code: `console.log([cursor]sayHello(name));
sendMessage(sayHello(name));`,
        expected: `const extracted = sayHello(name);
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "binary expression",
        code: `console.log(days <[cursor]= 10);
sendMessage(days <= 10);`,
        expected: `const extracted = days <= 10;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "logical expression",
        code: `console.log(isValid &[cursor]& days > 10);
sendMessage(isValid && days > 10);`,
        expected: `const extracted = isValid && days > 10;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "unary expression",
        code: `console.log([cursor]!(isValid && days > 10));
sendMessage(!(isValid && days > 10));`,
        expected: `const extracted = !(isValid && days > 10);
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "member expression",
        code: `console.log(this.items[i][cursor]);
sendMessage(this.items[i]);`,
        expected: `const extracted = this.items[i];
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "new expression",
        code: `console.log([cursor]new Actor("John"));
sendMessage(new Actor("John"));`,
        expected: `const actor = new Actor("John");
console.log(actor);
sendMessage(actor);`
      },
      {
        description: "JSX Element",
        code: `console.log([cursor]<p>Hello</p>);
sendMessage(<p>Hello</p>);`,
        expected: `const extracted = <p>Hello</p>;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "JSX Element with attributes",
        code: `console.log([cursor]<p color="black">Hello</p>);
sendMessage(<p color="black">Hello</p>);`,
        expected: `const extracted = <p color="black">Hello</p>;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "self-closing JSX Element",
        code: `console.log([cursor]<Dialog color="black" />);
sendMessage(<Dialog color="black" />);`,
        expected: `const extracted = <Dialog color="black" />;
console.log(extracted);
sendMessage(extracted);`
      },
      {
        description: "inside an if statement",
        code: `function venueBtnName() {
  if (window.location.href.includes('raw')) {
    [start]document.getElementById('venueExampleBtn')[end].innerHTML = 'Venue Examples';
  } else {
    document.getElementById('venueExampleBtn').innerHTML = 'Venue Group Details';
  }
}`,
        expected: `function venueBtnName() {
  const extracted = document.getElementById('venueExampleBtn');
  if (window.location.href.includes('raw')) {
    extracted.innerHTML = 'Venue Examples';
  } else {
    extracted.innerHTML = 'Venue Group Details';
  }
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );
});
