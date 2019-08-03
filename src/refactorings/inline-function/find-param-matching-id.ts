import * as ast from "../../ast";

export { findParamMatchingId };

/**
 * We use a Composite pattern to find the matching param.
 *
 * This is relevant because we can either:
 * - have a Leaf Node (e.g. an Identifier) that is a match
 * - have a Composite Node (e.g. an ArrayPattern) that would contain
 *   a Leaf Node at some point
 *
 * The Component interface contains 2 information for the Client:
 * 1. `isMatch` that tells if the given Identifier matches a param
 * 2. `resolveValue()` that takes the CallExpression arguments and returns
 *    the Value to be used instead of the Identifier
 *
 * See https://refactoring.guru/design-patterns/composite
 *
 * Example:
 *
 *     // Imagine this simple FunctionDeclaration:
 *     function add(a, b) {
 *       return a + b;
 *     }
 *
 *     // Now, consider this CallExpression:
 *     add(1, 2);
 *
 *     // In the FunctionDeclaration body,
 *     // `findParamMatchingId()` will return a `MatchingIdentifier` for `a`.
 *     // Resolving its value with the CallExpression args will return `1`.
 */

function findParamMatchingId(
  id: ast.Identifier,
  params: ast.Node[]
): MatchingParam {
  return params.reduce((result: MatchingParam, param, index) => {
    if (result.isMatch) return result;

    if (ast.isIdentifier(param) && param.name === id.name) {
      return new MatchingIdentifier(index);
    }

    if (ast.isArrayPattern(param)) {
      return new MatchingArray(index, findParamMatchingId(id, param.elements));
    }

    if (ast.isObjectPattern(param)) {
      const values = getPropertiesValues(param);
      return new MatchingObject(index, findParamMatchingId(id, values));
    }

    return result;
  }, new NoMatch());
}

function getPropertiesValues(
  param: ast.ObjectPattern
): ast.ObjectProperty["value"][] {
  return param.properties
    .map(property => {
      if (ast.isRestElement(property)) return null;
      return property.value;
    })
    .filter((el): el is ast.ObjectProperty["value"] => el !== null);
}

// 🎭 Component interface

interface MatchingParam {
  isMatch: boolean;
  resolveValue: (args: Value[]) => Value;
}

type Value = ast.Node | null;

// 🍂 Leaves

class NoMatch implements MatchingParam {
  isMatch = false;

  resolveValue() {
    return null;
  }
}

class MatchingIdentifier implements MatchingParam {
  isMatch = true;
  private index: number;

  constructor(index: number) {
    this.index = index;
  }

  resolveValue(args: Value[]) {
    return args[this.index];
  }
}

// 📦 Composites

class MatchingArray implements MatchingParam {
  private matchingParam: MatchingParam;
  private index: number;

  constructor(index: number, matchingParam: MatchingParam) {
    this.index = index;
    this.matchingParam = matchingParam;
  }

  get isMatch() {
    return this.matchingParam.isMatch;
  }

  resolveValue(args: Value[]) {
    const value = args[this.index];
    if (!ast.isArrayExpression(value)) return null;
    return this.matchingParam.resolveValue(value.elements);
  }
}

class MatchingObject implements MatchingParam {
  private index: number;
  private matchingParam: MatchingParam;

  constructor(index: number, matchingParam: MatchingParam) {
    this.index = index;
    this.matchingParam = matchingParam;
  }

  get isMatch() {
    return this.matchingParam.isMatch;
  }

  resolveValue(args: Value[]) {
    const value = args[this.index];
    if (!ast.isObjectExpression(value)) return null;

    const property = this.matchingParam.resolveValue(value.properties);
    if (!ast.isObjectProperty(property)) return null;

    return property.value;
  }
}
