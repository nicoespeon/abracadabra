# Abracadabra - Claude Development Guide

## Adding a New Refactoring

### Reference Example

Look at commit `a8e8ff17f07a5000689a2b3e6cc7994227695926` for a complete example of adding a new refactoring.

### TDD Approach

Follow Test-Driven Development:

1. Create tests first to illustrate desired behavior
2. Implement to make tests pass
3. Refactor to match coding style

### File Structure

Each refactoring lives in its own directory:

```
src/refactorings/{refactoring-name}/
├── index.ts                          # Configuration export
├── {refactoring-name}.ts             # Main implementation
└── {refactoring-name}.test.ts        # Tests
```

### Files to Create/Modify

1. **Create** `src/refactorings/{name}/{name}.ts` - Main implementation
2. **Create** `src/refactorings/{name}/{name}.test.ts` - Tests
3. **Create** `src/refactorings/{name}/index.ts` - Config export
4. **Modify** `src/extension.ts` - Import and register the refactoring
5. **Modify** `package.json` - Add command, configuration, and menu entry

### Implementation Pattern

Always use AST transformations, not RegExp. Follow this structure:

```typescript
import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function myRefactoring(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("element to refactor");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path) => {
      // Transform the AST node
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  return {
    // Visitor for specific AST node types
    SomeNodeType(path) {
      if (!selection.isInsidePath(path)) return;
      onMatch(path);
    }
  };
}
```

### Config File (index.ts)

For refactorings with Quick Fix action provider:

```typescript
import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { myRefactoring, createVisitor } from "./my-refactoring";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "myRefactoring", // camelCase
    operation: myRefactoring,
    title: "My Refactoring"
  },
  actionProvider: {
    message: "Refactor this",
    createVisitor
  }
};

export default config;
```

### Test Pattern

```typescript
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { myRefactoring } from "./my-refactoring";

describe("My Refactoring", () => {
  it("does the thing", () => {
    shouldRefactor({
      code: `input code with [cursor] marker`,
      expected: `expected output`
    });
  });

  it("shows error when not applicable", () => {
    shouldShowError({
      code: `code that should not match`
    });
  });
});

function shouldRefactor({ code, expected }: { code: Code; expected: Code }) {
  const editor = new InMemoryEditor(code);
  const result = myRefactoring({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });
  expect(result).toMatchObject({ action: "write", code: expected });
}

function shouldShowError({ code }: { code: Code }) {
  const editor = new InMemoryEditor(code);
  const result = myRefactoring({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });
  expect(result.action).toBe("show error");
}
```

**Test cursor markers:**

- `[cursor]` - Cursor position
- `[start]` and `[end]` - Selection range

### Registration in extension.ts

```typescript
// 1. Import
import myRefactoring from "./refactorings/my-refactoring";

// 2. Add to appropriate category in refactorings object
const refactorings = {
  allLanguages: {
    withActionProvider: [
      // ... existing refactorings
      myRefactoring
    ]
  }
};
```

### package.json Updates

Add in three places:

1. **Command** in `contributes.commands`:

```json
{
  "command": "abracadabra.myRefactoring",
  "title": "My Refactoring",
  "category": "Abracadabra"
}
```

2. **Configuration** in `contributes.configuration.properties`:

```json
"abracadabra.myRefactoring.showInQuickFix": {
  "type": "boolean",
  "default": true,
  "description": "Check if it should appear in the Quick Fix suggestions when it can be executed"
}
```

3. **Menu** in `contributes.menus.commandPalette`:

```json
{
  "command": "abracadabra.myRefactoring",
  "when": "editorLangId == javascript || editorLangId == javascriptreact || editorLangId == typescript || editorLangId == typescriptreact || editorLangId == vue || editorLangId == svelte"
}
```

### Key Principles

1. **Use AST, not RegExp** - Use Babel types (`t.isFunctionDeclaration()`, etc.) instead of regex patterns
2. **Use `t.transformAST`** - Standard way to transform code
3. **Export `createVisitor`** - Required for action provider to detect when refactoring is applicable
4. **Handle Recast comments** - Use `@ts-expect-error` for Recast's custom `comments` attribute when manipulating comments
5. **Check `hasCodeChanged`** - Always verify transformation happened before returning

### Useful AST Helpers

- `t.parse(code)` - Parse code to AST
- `t.transformAST(ast, visitor)` - Transform AST with visitor
- `t.traverseAST(ast, visitor)` - Traverse without transforming
- `selection.isInsidePath(path)` - Check if cursor is in a node
- `path.node.leadingComments` - Access comments attached to a node

### Running Tests

```bash
yarn test --testPathPatterns="my-refactoring" --no-coverage
yarn typecheck
```
