import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { extractToInstanceProperty } from "./extract-to-instance-property";

describe("Extract to Instance Property", () => {
  describe("TypeScript (uses class property declaration)", () => {
    it("with explicit type annotation", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    [cursor]let size: number = 42;
  }
}`,
        expected: `class Thing {
  private size: number | null = null;
  constructor() {}

  method() {
    this.size = 42;
  }
}`
      });
    });

    it("with non-primitive, explicit type annotation", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  method() {
    [cursor]let items: string[] = [];
  }
}`,
        expected: `class Thing {
  private items: string[] | null = null;
  method() {
    this.items = [];
  }
}`
      });
    });

    it("detects TypeScript when class has private property", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private name = "test";

  method() {
    [cursor]let size = 42;
  }
}`,
        expected: `class Thing {
  private name = "test";

  private size: number | null = null;

  method() {
    this.size = 42;
  }
}`
      });
    });

    it("detects TypeScript from interface in file", () => {
      shouldExtractToInstanceProperty({
        code: `interface Config {
  value: number;
}

class Thing {
  method() {
    [cursor]let size = 42;
  }
}`,
        expected: `interface Config {
  value: number;
}

class Thing {
  private size: number | null = null;
  method() {
    this.size = 42;
  }
}`
      });
    });

    it("replaces all references in method", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private other: string = "";

  method() {
    [cursor]let size = 42;
    console.log(size);
    return size * 2;
  }
}`,
        expected: `class Thing {
  private other: string = "";

  private size: number | null = null;

  method() {
    this.size = 42;
    console.log(this.size);
    return this.size * 2;
  }
}`
      });
    });

    it("infers number type from arithmetic expression", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private x: number = 0;

  method() {
    let a = 10;
    let b = 10;
    [cursor]let size = a * b;
  }
}`,
        expected: `class Thing {
  private x: number = 0;

  private size: number | null = null;

  method() {
    let a = 10;
    let b = 10;
    this.size = a * b;
  }
}`
      });
    });

    it("infers string type from string literal", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private x: number = 0;

  method() {
    [cursor]let name = "hello";
  }
}`,
        expected: `class Thing {
  private x: number = 0;

  private name: string | null = null;

  method() {
    this.name = "hello";
  }
}`
      });
    });

    it("infers boolean type from boolean literal", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private x: number = 0;

  method() {
    [cursor]let active = true;
  }
}`,
        expected: `class Thing {
  private x: number = 0;

  private active: boolean | null = null;

  method() {
    this.active = true;
  }
}`
      });
    });

    it("infers array type from array literal", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private x: number = 0;

  method() {
    [cursor]let items = [1, 2, 3];
  }
}`,
        expected: `class Thing {
  private x: number = 0;

  private items: number[] | null = null;

  method() {
    this.items = [1, 2, 3];
  }
}`
      });
    });

    it("uses no type when type cannot be inferred", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  private x: number = 0;

  method() {
    [cursor]let result = someFunction();
  }
}`,
        expected: `class Thing {
  private x: number = 0;

  private result = null;

  method() {
    this.result = someFunction();
  }
}`
      });
    });
  });

  describe("JavaScript (uses constructor initialization)", () => {
    it("basic case with existing constructor", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  method() {
    let a = 10;
    let b = 10;
    [cursor]let size = a * b;
  }
}`,
        expected: `class Thing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = null;
  }

  method() {
    let a = 10;
    let b = 10;
    this.size = a * b;
  }
}`
      });
    });

    it("when constructor doesn't exist, creates one", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  method() {
    [cursor]let size = 100;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method() {
    this.size = 100;
  }
}`
      });
    });

    it("with const declaration", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    [cursor]const value = 42;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.value = null;
  }

  method() {
    this.value = 42;
  }
}`
      });
    });

    it("with var declaration", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    [cursor]var value = 42;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.value = null;
  }

  method() {
    this.value = 42;
  }
}`
      });
    });

    it("works with arrow function methods", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method = () => {
    [cursor]let size = 42;
  };
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method = () => {
    this.size = 42;
  };
}`
      });
    });

    it("works inside getter", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  get computed() {
    [cursor]let value = 42;
    return value;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.value = null;
  }

  get computed() {
    this.value = 42;
    return this.value;
  }
}`
      });
    });

    it("works inside setter", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  set size(val) {
    [cursor]let computed = val * 2;
    console.log(computed);
  }
}`,
        expected: `class Thing {
  constructor() {
    this.computed = null;
  }

  set size(val) {
    this.computed = val * 2;
    console.log(this.computed);
  }
}`
      });
    });

    it("replaces all references to the variable in the same method", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    [cursor]let size = 42;
    console.log(size);
    return size * 2;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method() {
    this.size = 42;
    console.log(this.size);
    return this.size * 2;
  }
}`
      });
    });

    it("when class has other methods, doesn't affect them", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method1() {
    [cursor]let size = 42;
    return size;
  }

  method2() {
    let size = 100;
    return size;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method1() {
    this.size = 42;
    return this.size;
  }

  method2() {
    let size = 100;
    return size;
  }
}`
      });
    });

    it("selection on variable name", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    let [cursor]size = 42;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method() {
    this.size = 42;
  }
}`
      });
    });

    it("selection on initializer", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  method() {
    let size = [cursor]42;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  method() {
    this.size = 42;
  }
}`
      });
    });

    it("works with static method", () => {
      shouldExtractToInstanceProperty({
        code: `class Thing {
  constructor() {}

  static method() {
    [cursor]let size = 42;
    return size;
  }
}`,
        expected: `class Thing {
  constructor() {
    this.size = null;
  }

  static method() {
    this.size = 42;
    return this.size;
  }
}`
      });
    });
  });

  describe("should show error", () => {
    it("when not inside a class", () => {
      shouldShowError({
        code: `function test() {
  [cursor]let size = 42;
}`
      });
    });

    it("when not inside a method", () => {
      shouldShowError({
        code: `class Thing {
  [cursor]size = 42;
}`
      });
    });

    it("when variable has no initializer", () => {
      shouldShowError({
        code: `class Thing {
  method() {
    [cursor]let size;
  }
}`
      });
    });

    it("when cursor is not on a variable declaration", () => {
      shouldShowError({
        code: `class Thing {
  method() {
    [cursor]console.log("hello");
  }
}`
      });
    });

    it("when on destructured declaration", () => {
      shouldShowError({
        code: `class Thing {
  method() {
    [cursor]const { a, b } = obj;
  }
}`
      });
    });
  });
});

function shouldExtractToInstanceProperty({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = extractToInstanceProperty({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldShowError({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = extractToInstanceProperty({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  expect(result.action).toBe("show error");
}
