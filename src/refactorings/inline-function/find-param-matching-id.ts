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

    if (ast.isIdentifier(param)) {
      return new MatchingIdentifier(index, id, param);
    }

    if (ast.isArrayPattern(param)) {
      return new MatchingArray(index, findParamMatchingId(id, param.elements));
    }

    if (ast.isObjectPattern(param)) {
      const values = getPropertiesValues(param);
      return new MatchingObject(index, findParamMatchingId(id, values));
    }

    if (ast.isRestElement(param)) {
      const argument = param.argument;

      if (ast.isIdentifier(argument)) {
        return new MatchingRestIdentifier(index, params, id, argument);
      }

      return new MatchingRestElement(
        index,
        findParamMatchingId(id, [argument])
      );
    }

    return result;
  }, new NoMatch());
}

function getPropertiesValues(
  param: ast.ObjectPattern
): ast.ObjectProperty["value"][] {
  return param.properties
    .map(property => {
      if (ast.isRestElement(property)) return property;
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
  private index: number;
  private id: ast.Identifier;
  private param: ast.Identifier;

  constructor(index: number, id: ast.Identifier, param: ast.Identifier) {
    this.index = index;
    this.id = id;
    this.param = param;
  }

  get isMatch() {
    return this.id.name === this.param.name;
  }

  resolveValue(args: Value[]) {
    return args[this.index];
  }
}

class MatchingRestIdentifier implements MatchingParam {
  private index: number;
  private id: ast.Identifier;
  private argument: ast.Identifier;
  private omittedIdNames: ast.Identifier["name"][];

  constructor(
    index: number,
    params: ast.Node[],
    id: ast.Identifier,
    argument: ast.Identifier
  ) {
    this.index = index;
    this.id = id;
    this.argument = argument;
    this.omittedIdNames = params
      .filter((param): param is ast.Identifier => ast.isIdentifier(param))
      .map(param => param.name);
  }

  get isMatch() {
    return this.id.name === this.argument.name;
  }

  resolveValue(args: Value[]) {
    return ast.areAllObjectProperties(args)
      ? this.resolveObjectExpressionValue(args)
      : this.resolveArrayExpressionValue(args);
  }

  private resolveObjectExpressionValue(args: ast.ObjectProperty[]): Value {
    const pickedArgs = args.filter(
      arg =>
        !(
          ast.isIdentifier(arg.key) &&
          this.omittedIdNames.includes(arg.key.name)
        )
    );

    return ast.objectExpression(pickedArgs);
  }

  private resolveArrayExpressionValue(args: Value[]): Value {
    const elements = args
      .slice(this.index)
      .filter(ast.isArrayExpressionElement);
    return ast.arrayExpression(elements);
  }
}

// 📦 Composites

class MatchingArray implements MatchingParam {
  private index: number;
  private child: MatchingParam;

  constructor(index: number, child: MatchingParam) {
    this.index = index;
    this.child = child;
  }

  get isMatch() {
    return this.child.isMatch;
  }

  resolveValue(args: Value[]) {
    return ast.areAllObjectProperties(args)
      ? this.resolveObjectExpressionValue(args)
      : this.resolveArrayExpressionValue(args);
  }

  private resolveObjectExpressionValue(args: ast.ObjectProperty[]): Value {
    return this.resolveArrayExpressionValue(args.map(arg => arg.value));
  }

  private resolveArrayExpressionValue(args: Value[]) {
    const value = args[this.index];
    if (!ast.isArrayExpression(value)) return value;
    return this.child.resolveValue(value.elements);
  }
}

class MatchingObject implements MatchingParam {
  private index: number;
  private child: MatchingParam;

  constructor(index: number, child: MatchingParam) {
    this.index = index;
    this.child = child;
  }

  get isMatch() {
    return this.child.isMatch;
  }

  resolveValue(args: Value[]) {
    const value = args[this.index];
    if (!ast.isObjectExpression(value)) return value;

    const property = this.child.resolveValue(value.properties);
    if (!ast.isObjectProperty(property)) return property;

    return property.value;
  }
}

class MatchingRestElement implements MatchingParam {
  private index: number;
  private child: MatchingParam;

  constructor(index: number, child: MatchingParam) {
    this.index = index;
    this.child = child;
  }

  get isMatch() {
    return this.child.isMatch;
  }

  resolveValue(args: Value[]) {
    const values = args.slice(this.index);
    return this.child.resolveValue(values);
  }
}
