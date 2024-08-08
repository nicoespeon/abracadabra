import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeDeadCode } from "./remove-dead-code";

describe("Remove Dead Code", () => {
  testEach<{ code: Code; expected: Code }>(
    "should remove dead code",
    [
      {
        description: "if(false)",
        code: `console.log("I'm alive");
[cursor]if (false) {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");`
      },
      {
        description: "if(false) with else",
        code: `console.log("I'm alive");
[cursor]if (false) {
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
[cursor]if (false) {
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
[cursor]if (true) {
  console.log("I'm alive too");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      },
      {
        description: "if(true) with else",
        code: `console.log("I'm alive");
[cursor]if (true) {
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
[cursor]if (true) {
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
[cursor]if (false) {
  console.log("I'm also dead");
}`,
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
      },
      {
        description: "empty if",
        code: `if (item.quality > 40) {}`,
        expected: ``
      },
      {
        description: "empty nested ifs",
        code: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.quality < 50) {
  }

  if (item.sellIn > 10) {
  } else if (item.sellIn > 5) {
  } else {
  }

  if (item.quality > 0) {
  } else if (item.quality > 10) {
    if (item.sellIn > 10) {
    }
  } else {
    item.quality -= 1;
  }
} else {
}`,
        expected: `if (item.name === "Aged Brie") {
  item.quality += 1;

  if (item.quality > 0) {
  } else if (item.quality > 10) {} else {
    item.quality -= 1;
  }
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await removeDeadCode(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should not remove code",
    [
      {
        description: "test variable is re-assigned",
        code: `if (item.quality > 50) {
  item.quality += 1;
  if (item.quality > 50) {
    console.log("High quality");
  }
}`
      },
      {
        description: "test variable is re-assigned, else branch",
        code: `if (item.quality > 50) {
} else {
  item.quality += 1;
  if (item.quality < 50) {
    console.log("High quality");
  }
}`
      },
      {
        description: "if statement without braces",
        code: `if (minusResult === 1) score = '[cursor]Advantage player1';`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await removeDeadCode(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await removeDeadCode(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindDeadCode
    );
  });
});
