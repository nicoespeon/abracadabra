import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function convertCommentToJSDoc(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("a single-line comment to convert");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, comments) => {
      convertCommentsToJSDoc(path, comments);
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath, comments: t.CommentLine[]) => void
): t.Visitor {
  let hasMatched = false;

  return {
    enter(path) {
      if (hasMatched) return;

      const leadingComments = path.node.leadingComments;
      if (!leadingComments || leadingComments.length === 0) return;

      const singleLineComments = leadingComments.filter(
        (comment): comment is t.CommentLine => comment.type === "CommentLine"
      );
      if (singleLineComments.length === 0) return;

      const consecutiveComments = findConsecutiveComments(
        singleLineComments,
        selection
      );
      if (consecutiveComments.length === 0) return;

      hasMatched = true;
      onMatch(path, consecutiveComments);
    }
  };
}

function convertCommentsToJSDoc(
  path: t.NodePath,
  comments: t.CommentLine[]
): void {
  const commentTexts = comments.map((c) => c.value.replace(/^\s/, ""));
  const useMultiLineFormat =
    comments.length > 1 || isFollowedByFunction(path.node);

  const jsDocValue = useMultiLineFormat
    ? createMultiLineJSDocValue(commentTexts)
    : `* ${commentTexts[0]} `;

  const jsDocComment: t.CommentBlock = {
    type: "CommentBlock",
    value: jsDocValue
  };

  removeComments(path.node, comments);
  addJSDocComment(path.node, jsDocComment);
}

function createMultiLineJSDocValue(commentTexts: string[]): string {
  const lines = commentTexts.map((text) => ` * ${text}`);
  return `*\n${lines.join("\n")}\n `;
}

function removeComments(node: t.Node, commentsToRemove: t.CommentLine[]): void {
  if (!node.leadingComments) return;

  const commentsToRemoveSet = new Set(commentsToRemove);
  node.leadingComments = node.leadingComments.filter(
    (c) => !commentsToRemoveSet.has(c as t.CommentLine)
  );

  // @ts-expect-error Recast uses a custom `comments` attribute
  if (node.comments) {
    // @ts-expect-error Recast uses a custom `comments` attribute
    node.comments = node.comments.filter(
      (c: t.Comment) => !commentsToRemoveSet.has(c as t.CommentLine)
    );
  }
}

function addJSDocComment(node: t.Node, jsDocComment: t.CommentBlock): void {
  if (!node.leadingComments) {
    node.leadingComments = [];
  }
  node.leadingComments.unshift(jsDocComment);

  // @ts-expect-error Recast uses a custom `comments` attribute
  if (!node.comments) {
    // @ts-expect-error Recast uses a custom `comments` attribute
    node.comments = [];
  }
  // @ts-expect-error Recast uses a custom `comments` attribute
  node.comments.unshift({ ...jsDocComment, leading: true });
}

function isFollowedByFunction(node: t.Node): boolean {
  if (t.isFunctionDeclaration(node)) return true;
  if (t.isClassMethod(node)) return true;
  if (t.isTSDeclareMethod(node)) return true;
  if (t.isObjectMethod(node)) return true;

  if (t.isVariableDeclaration(node)) {
    const declarator = node.declarations[0];
    if (declarator && t.isVariableDeclarator(declarator)) {
      const init = declarator.init;
      return t.isArrowFunctionExpression(init) || t.isFunctionExpression(init);
    }
  }

  if (t.isExpressionStatement(node)) {
    const expr = node.expression;
    if (t.isAssignmentExpression(expr)) {
      return (
        t.isArrowFunctionExpression(expr.right) ||
        t.isFunctionExpression(expr.right)
      );
    }
  }

  return false;
}

function findConsecutiveComments(
  comments: t.CommentLine[],
  selection: Selection
): t.CommentLine[] {
  const cursorLine = selection.start.line;

  const sortedComments = [...comments].sort((a, b) => {
    const lineA = a.loc?.start.line ?? 0;
    const lineB = b.loc?.start.line ?? 0;
    return lineA - lineB;
  });

  const groups = groupConsecutiveComments(sortedComments);

  for (const group of groups) {
    const firstComment = group[0];
    const lastComment = group[group.length - 1];

    if (!firstComment.loc || !lastComment.loc) continue;

    const startLine = firstComment.loc.start.line - 1;
    const endLine = lastComment.loc.end.line - 1;

    if (cursorLine >= startLine && cursorLine <= endLine) {
      return group;
    }
  }

  return [];
}

function groupConsecutiveComments(
  comments: t.CommentLine[]
): t.CommentLine[][] {
  if (comments.length === 0) return [];

  const groups: t.CommentLine[][] = [];
  let currentGroup: t.CommentLine[] = [comments[0]];

  for (let i = 1; i < comments.length; i++) {
    const prevComment = comments[i - 1];
    const currComment = comments[i];

    const prevLine = prevComment.loc?.end.line ?? 0;
    const currLine = currComment.loc?.start.line ?? 0;

    if (currLine === prevLine + 1) {
      currentGroup.push(currComment);
    } else {
      groups.push(currentGroup);
      currentGroup = [currComment];
    }
  }

  groups.push(currentGroup);
  return groups;
}
