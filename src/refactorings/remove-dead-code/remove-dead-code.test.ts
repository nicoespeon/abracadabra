import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeDeadCode } from "./remove-dead-code";

describe("Remove Dead Code", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should remove dead code",
    [
      {
        description: "if(false)",
        code: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");`
      },
      {
        description: "if(false) with else",
        code: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
} else {
  console.log("I'm alive too");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      },
      {
        description: "if(false) with else-if",
        code: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
} else if (isValid) {
  console.log("I'm valid");
} else {
  console.log("I'm not valid");
}`,
        expected: `console.log("I'm alive");
if (isValid) {
  console.log("I'm valid");
} else {
  console.log("I'm not valid");
}`
      },
      {
        description: "if(true)",
        code: `console.log("I'm alive");
if (true) {
  console.log("I'm alive too");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      },
      {
        description: "if(true) with else",
        code: `console.log("I'm alive");
if (true) {
  console.log("I'm alive too");
} else {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      },
      {
        description: "if(true) with else-if",
        code: `console.log("I'm alive");
if (true) {
  console.log("I'm alive too");
} else if (isValid) {
  console.log("I'm dead");
} else {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      },
      {
        description: "selected code only",
        code: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
}
if (false) {
  console.log("I'm also dead");
}`,
        selection: Selection.cursorAt(4, 0),
        expected: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
}`
      },
      {
        description: "nested ifs with opposite tests",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.name === "Backstage") {
    item.quality += 1;
  }

  if (item.name !== "Aged Brie") {
    item.quality -= 1;
  }
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;
}`
      },
      {
        description: "nested ifs with identical tests",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.name === "Aged Brie") {
    item.quality += 1;
  }

  if (item.quality > 0) {
    item.quality -= 1;
  }
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;

  item.quality += 1;

  if (item.quality > 0) {
    item.quality -= 1;
  }
}`
      },
      {
        description: "nested if-elses with opposite tests",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.name === "Backstage") {
    item.quality += 1;
  } else {
    item.quality -= 2;
  }

  if (item.name !== "Aged Brie") {
    item.quality -= 1;
  } else {
    item.sellIn -= 1;
  }
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;

  item.quality -= 2;
  item.sellIn -= 1;
}`
      },
      {
        description: "nested if-elses with identical tests",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.name === "Aged Brie") {
    item.quality += 1;
  } else {
    item.quality -= 1;
  }

  if (item.quality > 0) {
    item.quality -= 1;
  }
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;

  item.quality += 1;

  if (item.quality > 0) {
    item.quality -= 1;
  }
}`
      },
      {
        description: "nested if-elses, != operator on wrapper",
        code: `if (item.name != "Aged Brie") {
  item.quality += 1;

  if (item.name != "Backstage") {
    item.quality += 2;
  } else {
    item.quality -= 2;
  }

  if (item.name != "Aged Brie") {
    item.quality += 3;
  } else {
    item.quality -= 3;
  }
}`,
        expected: `if (item.name != "Aged Brie") {
  item.quality += 1;

  if (item.name != "Backstage") {
    item.quality += 2;
  } else {
    item.quality -= 2;
  }

  item.quality += 3;
}`
      },
      {
        description: "else branch",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.name === "Backstage") {
    item.quality += 1;
  }
} else {
  if (item.name === "Backstage") {
    item.quality += 1;
  }

  if (item.name === "Aged Brie") {
    item.quality += 1;
  }

  if (item.name !== "Aged Brie") {
    item.quality += 2;
  }
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;
} else {
  if (item.name === "Backstage") {
    item.quality += 1;
  }

  item.quality += 2;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(1, 0), expected }) => {
      const result = await doRemoveDeadCode(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doRemoveDeadCode(code, selection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.DidNotFoundDeadCode);
  });

  async function doRemoveDeadCode(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await removeDeadCode(code, selection, editor);
    return editor.code;
  }
});
