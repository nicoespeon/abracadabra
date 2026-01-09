import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function convertCommentToJSDoc(state: RefactoringState): EditorCommand {
  const { code, selection } = state;
  const result = findAndConvertComment(code, selection);

  if (!result) {
    return COMMANDS.showErrorDidNotFind("a single-line comment to convert");
  }

  return COMMANDS.write(result);
}

function findAndConvertComment(
  code: string,
  selection: Selection
): string | null {
  const lines = code.split("\n");
  const cursorLine = selection.start.line;

  const commentInfo = findCommentBlockAtLine(lines, cursorLine);
  if (!commentInfo) return null;

  const { startLine, endLine, comments, indentation } = commentInfo;

  if (!hasCodeFollowingComment(lines, endLine)) return null;
  if (isInlineComment(lines, startLine)) return null;

  const nextCodeLine = findNextCodeLine(lines, endLine);
  const followedByFunction =
    nextCodeLine !== null && isFollowedByFunction(lines, nextCodeLine);
  const jsDoc = createJSDoc(comments, indentation, followedByFunction);
  const newLines = [
    ...lines.slice(0, startLine),
    jsDoc,
    ...lines.slice(endLine + 1)
  ];

  return newLines.join("\n");
}

interface CommentBlock {
  startLine: number;
  endLine: number;
  comments: string[];
  indentation: string;
}

function findCommentBlockAtLine(
  lines: string[],
  cursorLine: number
): CommentBlock | null {
  const currentLine = lines[cursorLine];
  if (!currentLine || !isSingleLineComment(currentLine)) return null;

  const indentation = getIndentation(currentLine);
  let startLine = cursorLine;
  let endLine = cursorLine;

  while (
    startLine > 0 &&
    isSingleLineCommentWithIndent(lines[startLine - 1], indentation)
  ) {
    startLine--;
  }

  while (
    endLine < lines.length - 1 &&
    isSingleLineCommentWithIndent(lines[endLine + 1], indentation)
  ) {
    endLine++;
  }

  const comments = [];
  for (let i = startLine; i <= endLine; i++) {
    comments.push(extractCommentText(lines[i]));
  }

  return { startLine, endLine, comments, indentation };
}

function isSingleLineComment(line: string): boolean {
  return /^\s*\/\//.test(line);
}

function isSingleLineCommentWithIndent(
  line: string,
  indentation: string
): boolean {
  if (!isSingleLineComment(line)) return false;
  return getIndentation(line) === indentation;
}

function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : "";
}

function extractCommentText(line: string): string {
  const match = line.match(/^\s*\/\/\s?(.*)/);
  return match ? match[1] : "";
}

function hasCodeFollowingComment(lines: string[], endLine: number): boolean {
  for (let i = endLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !isSingleLineComment(lines[i])) {
      return true;
    }
  }
  return false;
}

function isInlineComment(lines: string[], line: number): boolean {
  const lineContent = lines[line];
  const beforeComment = lineContent.substring(0, lineContent.indexOf("//"));
  return beforeComment.trim().length > 0;
}

function findNextCodeLine(lines: string[], afterLine: number): number | null {
  for (let i = afterLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !isSingleLineComment(lines[i])) {
      return i;
    }
  }
  return null;
}

function isFollowedByFunction(lines: string[], lineIndex: number): boolean {
  const line = lines[lineIndex].trim();
  const functionPatterns = [
    /^(async\s+)?function\s/,
    /^(export\s+)?(async\s+)?function\s/,
    /^(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/,
    /^(const|let|var)\s+\w+\s*=\s*(async\s+)?\w+\s*=>/,
    /^\w+\s*\([^)]*\)\s*\{/,
    /^(async\s+)?\w+\s*\([^)]*\)\s*\{/
  ];

  return functionPatterns.some((pattern) => pattern.test(line));
}

function createJSDoc(
  comments: string[],
  indentation: string,
  forceMultiLine: boolean = false
): string {
  if (comments.length === 1 && !forceMultiLine) {
    return `${indentation}/** ${comments[0]} */`;
  }

  const lines = [
    `${indentation}/**`,
    ...comments.map((comment) => `${indentation} * ${comment}`),
    `${indentation} */`
  ];

  return lines.join("\n");
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath) => void
): t.Visitor {
  let hasMatched = false;

  return {
    enter(path) {
      if (hasMatched) return;

      const leadingComments = path.node.leadingComments;
      if (!leadingComments || leadingComments.length === 0) return;

      const singleLineComments = leadingComments.filter(
        (comment) => comment.type === "CommentLine"
      );
      if (singleLineComments.length === 0) return;

      const firstComment = singleLineComments[0];
      const lastComment = singleLineComments[singleLineComments.length - 1];

      if (!firstComment.loc || !lastComment.loc) return;

      const commentStartLine = firstComment.loc.start.line - 1;
      const commentEndLine = lastComment.loc.end.line - 1;
      const cursorLine = selection.start.line;

      if (cursorLine < commentStartLine || cursorLine > commentEndLine) return;

      hasMatched = true;
      onMatch(path);
    }
  };
}
