import { ErrorReason, Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractInterface } from "./extract-interface";

describe("Extract Interface", () => {
  testEach<{ code: Code; expected: Code }>(
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

[cursor]class AnotherPosition {
  isEqualTo(position: Position): boolean {
    return true;
  }
}`,
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
      },
      {
        description: "an exported class",
        code: `export class Foo[cursor] {
  constructor(readonly numbers: number[]) {}

  bar(): number {
    return this.numbers.length;
  }
}`,
        expected: `export class Foo implements Extracted {
  constructor(readonly numbers: number[]) {}

  bar(): number {
    return this.numbers.length;
  }
}

interface Extracted {
  readonly numbers: number[];
  bar(): number;
}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractInterface(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractInterface(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindClassToExtractInterface
    );
  });

  it("should move cursor to extracted interface name", async () => {
    const code = `class Position {
  constructor(name: string) {
    this.name = name;
  }

  isEqualTo(position: Position): boolean {
    return true;
  }
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "moveCursorTo");

    await extractInterface(editor);

    expect(editor.moveCursorTo).toBeCalledWith(new Position(10, 10));
  });
});
