import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { removeDeadCode } from "./remove-dead-code";

describe("Remove Dead Code", () => {
  describe("should remove dead code", () => {
    it("if(false)", () => {
      shouldRemoveDeadCode({
        code: `console.log("I'm alive");
[cursor]if (false) {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");`
      });
    });

    it("if(false) with else", () => {
      shouldRemoveDeadCode({
        code: `console.log("I'm alive");
[cursor]if (false) {
  console.log("I'm dead");
} else {
  console.log("I'm alive too");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      });
    });

    it("if(false) with else-if", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("if(true)", () => {
      shouldRemoveDeadCode({
        code: `console.log("I'm alive");
[cursor]if (true) {
  console.log("I'm alive too");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      });
    });

    it("if(true) with else", () => {
      shouldRemoveDeadCode({
        code: `console.log("I'm alive");
[cursor]if (true) {
  console.log("I'm alive too");
} else {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");
console.log("I'm alive too");`
      });
    });

    it("if(true) with else-if", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("selected code only", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("nested ifs with opposite tests", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("nested ifs with identical tests", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("nested if-elses with opposite tests", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("nested if-elses with identical tests", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("nested if-elses, != operator on wrapper", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("else branch", () => {
      shouldRemoveDeadCode({
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
      });
    });

    it("empty if", () => {
      shouldRemoveDeadCode({
        code: `if (item.quality > 40) {}`,
        expected: ``
      });
    });

    it("empty nested ifs", () => {
      shouldRemoveDeadCode({
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
      });
    });
  });

  describe("should not remove code", () => {
    it("test variable is re-assigned", () => {
      shouldNotRemoveCode({
        code: `if (item.quality > 50) {
  item.quality += 1;
  if (item.quality > 50) {
    console.log("High quality");
  }
}`
      });
    });

    it("test variable is re-assigned, else branch", () => {
      shouldNotRemoveCode({
        code: `if (item.quality > 50) {
} else {
  item.quality += 1;
  if (item.quality < 50) {
    console.log("High quality");
  }
}`
      });
    });

    it("if statement without braces", () => {
      shouldNotRemoveCode({
        code: `if (minusResult === 1) score = '[cursor]Advantage player1';`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = removeDeadCode({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldRemoveDeadCode({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = removeDeadCode({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldNotRemoveCode({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = removeDeadCode({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result.action).toBe("show error");
}
