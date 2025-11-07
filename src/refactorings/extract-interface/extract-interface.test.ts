import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { extractInterface } from "./extract-interface";

describe("Extract Interface", () => {
  it("inline type in param method", () => {
    shouldExtractInterface({
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
    });
  });

  it("method with optional params", () => {
    shouldExtractInterface({
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
    });
  });

  it("class with private method", () => {
    shouldExtractInterface({
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
    });
  });

  it("class with public properties", () => {
    shouldExtractInterface({
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
    });
  });

  it("class with private or protected properties", () => {
    shouldExtractInterface({
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
    });
  });

  it("properties auto-assigned in constructor", () => {
    shouldExtractInterface({
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
    });
  });

  it("selected class only", () => {
    shouldExtractInterface({
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
    });
  });

  it("an exported class", () => {
    shouldExtractInterface({
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
    });
  });

  it("an exported class (default export)", () => {
    shouldExtractInterface({
      code: `export default class Foo[cursor] {
  constructor(readonly numbers: number[]) {}

  bar(): number {
    return this.numbers.length;
  }
}`,
      expected: `export default class Foo implements Extracted {
  constructor(readonly numbers: number[]) {}

  bar(): number {
    return this.numbers.length;
  }
}

interface Extracted {
  readonly numbers: number[];
  bar(): number;
}`
    });
  });

  it("a generic class", () => {
    shouldExtractInterface({
      code: `class Foo<T extends string>[cursor] {
  constructor(readonly items: T[]) {}
}`,
      expected: `class Foo<T extends string> implements Extracted<T> {
  constructor(readonly items: T[]) {}
}

interface Extracted<T extends string> {
  readonly items: T[];
}`
    });
  });

  it("class that already implements interfaces", () => {
    shouldExtractInterface({
      code: `class Position implements Serializable, Configuration {
  constructor(name: string) {
    this.name = name;
  }

  isEqualTo(position: Position): boolean {
    return true;
  }
}`,
      expected: `class Position implements Serializable, Configuration, Extracted {
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
    });
  });

  it("class that lacks return types", () => {
    shouldExtractInterface({
      code: `class Position {
  isEqualTo(position: Position) {
    return true;
  }

  async fetch() {
    return repository.fetch(this.id);
  }
}`,
      expected: `class Position implements Extracted {
  isEqualTo(position: Position) {
    return true;
  }

  async fetch() {
    return repository.fetch(this.id);
  }
}

interface Extracted {
  /* TODO: add the missing return type */
  isEqualTo(position: Position): any;
  /* TODO: add the missing return type */
  fetch(): Promise<any>;
}`
    });
  });

  it("class with public method", () => {
    shouldExtractInterface({
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
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;

    const result = extractInterface({
      state: "new",
      code,
      selection: Selection.cursorAt(0, 0),
      highlightSources: []
    });

    expect(result.action).toBe("show error");
  });

  it("should move cursor to extracted interface name", () => {
    const code = `class Position {
  constructor(name: string) {
    this.name = name;
  }

  isEqualTo(position: Position): boolean {
    return true;
  }
}`;

    const result = extractInterface({
      state: "new",
      code,
      selection: Selection.cursorAt(0, 0),
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "write",
      newCursorPosition: new Position(10, 10)
    });
  });
});

function shouldExtractInterface({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);

  const result = extractInterface({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
