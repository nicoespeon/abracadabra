import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Multiple occurrences", () => {
  it("should not ask the user if there is only one occurrence", () => {
    const code = `console.log("Hel[cursor]lo");`;
    const editor = new InMemoryEditor(code);

    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).not.toBe("ask user choice");
  });

  it("should ask the user what to replace if there are multiple occurrences", () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
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
          value: "all occurrences",
          label: "Replace all 2 occurrences"
        },
        {
          value: "selected occurrence",
          label: "Replace this occurrence only"
        }
      ]
    });
  });

  it("should stop extraction if user doesn't select a choice", () => {
    const code = `console.log("Hel[cursor]lo");
sendMessage("Hello");`;
    const editor = new InMemoryEditor(code);

    let result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    // User cancels
    result = extractVariable({
      state: "with user responses",
      responses: [],
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result.action).toBe("do nothing");
  });

  it("should extract only selected occurrence if user says so", async () => {
    await shouldExtractVariable({
      code: `console.log("Hel[cursor]lo");
sendMessage("Hello");`,
      expected: `const hello = "Hello";
console.log(hello);
sendMessage("Hello");`,
      chooseSecondOccurrence: true
    });
  });

  it("should extract all occurrences if user says so", async () => {
    await shouldExtractVariable({
      code: `console.log("Hel[cursor]lo");
sendMessage("Hello");`,
      expected: `const hello = "Hello";
console.log(hello);
sendMessage(hello);`
    });
  });

  it("should put the extraction above the top most occurrence", async () => {
    await shouldExtractVariable({
      code: `console.log("Hello");
sendMessage("He[cursor]llo");`,
      expected: `const hello = "Hello";
console.log(hello);
sendMessage(hello);`
    });
  });

  it("should only extract occurrences in the scope of selected one", async () => {
    await shouldExtractVariable({
      code: `function sayHello() {
  track("said", "H[cursor]ello");
  console.log("Hello");
}

sendMessage("Hello");`,
      expected: `function sayHello() {
  const hello = "Hello";
  track("said", hello);
  console.log(hello);
}

sendMessage("Hello");`
    });
  });

  it("should make the extraction in the scope of all occurrences", async () => {
    await shouldExtractVariable({
      code: `function sayHello() {
  if (isValid) {
    track("said", "[cursor]Hello");
  }
  console.log("Hello");
}

sendMessage("Hello");`,
      expected: `function sayHello() {
  const hello = "Hello";
  if (isValid) {
    track("said", hello);
  }
  console.log(hello);
}

sendMessage("Hello");`
    });
  });

  it("should make the extraction in the scope of all occurrences (switch statement)", async () => {
    await shouldExtractVariable({
      code: `function addScore() {
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
}`,
      expected: `function addScore() {
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
}`
    });
  });

  it("should make the extraction in the scope of all occurrences (if statement)", async () => {
    await shouldExtractVariable({
      code: `if (isMorning) {
  console.log("[cursor]hello");
} else {
  console.log("hello");
}`,
      expected: `const hello = "hello";
if (isMorning) {
  console.log(hello);
} else {
  console.log(hello);
}`
    });
  });

  it("should rename the second occurrence", async () => {
    await shouldExtractVariable({
      code: `function repro(a: { b: { c: string } }, condition: boolean) {
  if (condition) {
    const myVar = a.b().c;
  } else {
    const myVar = [start]a.b()[end].c;
  }
}`,
      expected: `function repro(a: { b: { c: string } }, condition: boolean) {
  const extracted = a.b();
  if (condition) {
    const myVar = extracted.c;
  } else {
    const myVar = [cursor]extracted.c;
  }
}`
    });
  });

  describe("should extract variables of type", () => {
    it("string", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"Hello");
sendMessage("Hello");`,
        expected: `const hello = "Hello";
console.log(hello);
sendMessage(hello);`
      });
    });

    it("number", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]10);
sendMessage(10);`,
        expected: `const extracted = 10;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("boolean", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]true);
sendMessage(true);`,
        expected: `const extracted = true;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("null", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]null);
sendMessage(null);`,
        expected: `const extracted = null;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("undefined", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]undefined);
sendMessage(undefined);`,
        expected: `const extracted = undefined;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("array", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor][1, 3, 4]);
sendMessage([1, 3, 4]);`,
        expected: `const extracted = [1, 3, 4];
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("only identical arrays", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor][1, 3, 4]);
sendMessage([1, 3, 4]);
const dontExtract = [];`,
        expected: `const extracted = [1, 3, 4];
console.log(extracted);
sendMessage(extracted);
const dontExtract = [];`
      });
    });

    it("object", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]{ one: 1, foo: "bar" });
sendMessage({ one: 1, foo: "bar" });`,
        expected: `const extracted = { one: 1, foo: "bar" };
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("object (multi-line)", async () => {
      await shouldExtractVariable({
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
      });
    });

    it("arrow function expression", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]() => "Hello");
sendMessage(() => "Hello");`,
        expected: `const extracted = () => "Hello";
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("call expression", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]sayHello());
sendMessage(sayHello());`,
        expected: `const extracted = sayHello();
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("call expression with arguments", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]sayHello(name));
sendMessage(sayHello(name));`,
        expected: `const extracted = sayHello(name);
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("binary expression", async () => {
      await shouldExtractVariable({
        code: `console.log(days <[cursor]= 10);
sendMessage(days <= 10);`,
        expected: `const extracted = days <= 10;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("logical expression", async () => {
      await shouldExtractVariable({
        code: `console.log(isValid &[cursor]& days > 10);
sendMessage(isValid && days > 10);`,
        expected: `const extracted = isValid && days > 10;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("unary expression", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]!(isValid && days > 10));
sendMessage(!(isValid && days > 10));`,
        expected: `const extracted = !(isValid && days > 10);
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("member expression", async () => {
      await shouldExtractVariable({
        code: `console.log(this.items[i][cursor]);
sendMessage(this.items[i]);`,
        expected: `const extracted = this.items[i];
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("new expression", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]new Actor("John"));
sendMessage(new Actor("John"));`,
        expected: `const actor = new Actor("John");
console.log(actor);
sendMessage(actor);`
      });
    });

    it("JSX Element", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]<p>Hello</p>);
sendMessage(<p>Hello</p>);`,
        expected: `const extracted = <p>Hello</p>;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("JSX Element with attributes", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]<p color="black">Hello</p>);
sendMessage(<p color="black">Hello</p>);`,
        expected: `const extracted = <p color="black">Hello</p>;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("self-closing JSX Element", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]<Dialog color="black" />);
sendMessage(<Dialog color="black" />);`,
        expected: `const extracted = <Dialog color="black" />;
console.log(extracted);
sendMessage(extracted);`
      });
    });

    it("inside an if statement", async () => {
      await shouldExtractVariable({
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
      });
    });
  });
});

async function shouldExtractVariable({
  code,
  expected,
  chooseSecondOccurrence = false
}: {
  code: Code;
  expected: Code;
  chooseSecondOccurrence?: boolean;
}) {
  const editor = new InMemoryEditor(code);
  let result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  const responses: Array<{ id: string; type: "choice"; value: any }> = [];

  while (result.action === "ask user choice") {
    const choice = chooseSecondOccurrence
      ? result.choices[1]
      : result.choices[0];

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
