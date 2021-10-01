import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { destructureObject } from "./destructure-object";

describe("Destructure Object", () => {
  testEach<{ code: Code; expected: Code }>(
    "should destructure object",
    [
      {
        description: "from interface",
        code: `interface MyComponentProps {
  name: string;
  age: number;
}

const MyComponent = (props[cursor]: MyComponentProps) => {};`,
        expected: `interface MyComponentProps {
  name: string;
  age: number;
}

const MyComponent = (
  {
    name,
    age
  }: MyComponentProps
) => {};`
      },
      {
        description: "from type",
        code: `type MyComponentProps = {
  name: string;
  age: number;
}

const MyComponent = (props[cursor]: MyComponentProps) => {};`,
        expected: `type MyComponentProps = {
  name: string;
  age: number;
}

const MyComponent = (
  {
    name,
    age
  }: MyComponentProps
) => {};`
      },
      {
        description: "from inline type",
        code: `const MyComponent = (props[cursor]: { firstName: string }) => {};`,
        expected: `const MyComponent = (
  {
    firstName
  }: { firstName: string }
) => {};`
      },
      {
        description: "and replace usages",
        code: `interface Props {
  name: string;
  age: number;
}

const MyComponent = (props[cursor]: Props) => {
  return <div>{props.name} ({props.age})</div>;
};`,
        expected: `interface Props {
  name: string;
  age: number;
}

const MyComponent = (
  {
    name,
    age
  }: Props
) => {
  return <div>{name} ({age})</div>;
};`
      },
      {
        description: "a regular identifier",
        code: `interface Props {
  name: string;
  age: number;
}

const props[cursor]: Props = { name: "John", age: 20 };

console.log(props.name, props.age);`,
        expected: `interface Props {
  name: string;
  age: number;
}

const {
  name,
  age
}: Props = { name: "John", age: 20 };

console.log(name, age);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await destructureObject(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code }>(
    "should NOT destructure object",
    [
      {
        description: "from type that's not an object pattern",
        code: `type MyComponentProps = string;

const MyComponent = (props[cursor]: MyComponentProps) => {};`
      },
      {
        description: "from tuple",
        code: `type MyComponentProps = [string, number];

const MyComponent = (props[cursor]: MyComponentProps) => {};`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await destructureObject(editor);

      expect(editor.code).toBe(originalCode);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await destructureObject(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindObjectToDestructure
    );
  });
});
