import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractInterface } from "./extract-interface";

describe.only("Extract Interface", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract interface",
    [
      {
        description: "class with public method",
        code: `class Position {
  constructor(name: string) {
    this.name = name;
  }

  isEqualTo(position: Position): boolean {
    return true;
  }
}`,
        expected: `class Position implements Extracted {
  constructor(name: string) {
    this.name = name;
  }

  isEqualTo(position: Position): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position: Position): boolean;
}`
      },
      {
        description: "inline type in param method",
        code: `class Position {
  isEqualTo(position: {x: number, y: number}): boolean {
    return true;
  }
}`,
        expected: `class Position implements Extracted {
  isEqualTo(position: {x: number, y: number}): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position: {x: number, y: number}): boolean;
}`
      },
      {
        description: "method with optional params",
        code: `class Position {
  isEqualTo(position?: Position): boolean {
    return true;
  }
}`,
        expected: `class Position implements Extracted {
  isEqualTo(position?: Position): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position?: Position): boolean;
}`
      },
      {
        description: "class with private method",
        code: `class Position {
  isEqualTo(position: Position): boolean {
    return true;
  }

  private doSomething(): void {}
  #doSomethingElse(): void {}
}`,
        expected: `class Position implements Extracted {
  isEqualTo(position: Position): boolean {
    return true;
  }

  private doSomething(): void {}
  #doSomethingElse(): void {}
}

interface Extracted {
  isEqualTo(position: Position): boolean;
}`
      },
      {
        description: "class with public properties",
        code: `class Position {
  x: number;
  readonly y = 10;
  isValid = true;
  name = "point";
  someData = [];
}`,
        expected: `class Position implements Extracted {
  x: number;
  readonly y = 10;
  isValid = true;
  name = "point";
  someData = [];
}

interface Extracted {
  x: number;
  readonly y: number;
  isValid: boolean;
  name: string;
  someData: any;
}`
      },
      {
        description: "class with private or protected properties",
        code: `class Position {
  x: number;
  private y = 10;
  #isValid = true;
  protected name: string;
}`,
        expected: `class Position implements Extracted {
  x: number;
  private y = 10;
  #isValid = true;
  protected name: string;
}

interface Extracted {
  x: number;
}`
      },
      {
        description: "properties auto-assigned in constructor",
        code: `class Position {
  constructor(
    public name: string,
    public readonly isValid: boolean = true,
    private x: number,
    public y = 0
  ) {}
}`,
        expected: `class Position implements Extracted {
  constructor(
    public name: string,
    public readonly isValid: boolean = true,
    private x: number,
    public y = 0
  ) {}
}

interface Extracted {
  name: string;
  readonly isValid: boolean;
  y: number;
}`
      },
      {
        description: "selected class only",
        code: `class Position {
  isEqualTo(position: Position): boolean {
    return true;
  }
}

class AnotherPosition {
  isEqualTo(position: Position): boolean {
    return true;
  }
}`,
        selection: Selection.cursorAt(6, 0),
        expected: `class Position {
  isEqualTo(position: Position): boolean {
    return true;
  }
}

class AnotherPosition implements Extracted {
  isEqualTo(position: Position): boolean {
    return true;
  }
}

interface Extracted {
  isEqualTo(position: Position): boolean;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractInterface(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doExtractInterface(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundClassToExtractInterface
    );
  });

  async function doExtractInterface(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await extractInterface(code, selection, editor);
    return editor.code;
  }
});
