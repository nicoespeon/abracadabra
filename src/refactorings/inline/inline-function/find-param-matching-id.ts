import * as t from "../../../ast";

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

export function findParamMatchingId(
  id: t.Identifier,
  params: (t.Node | null)[]
): MatchingParam {
  return params.reduce((result: MatchingParam, param, index) => {
    if (result.isMatch) return result;

    if (t.isIdentifier(param)) {
      return new MatchingIdentifier(index, id, param);
    }

    if (t.isAssignmentPattern(param)) {
      return new MatchingAssignment(index, id, param);
    }

    if (t.isArrayPattern(param)) {
      return new MatchingArray(index, findParamMatchingId(id, param.elements));
    }

    if (t.isObjectPattern(param)) {
      const values = getPropertiesValues(param);
      return new MatchingObject(index, findParamMatchingId(id, values));
    }

    if (t.isRestElement(param)) {
      const argument = param.argument;

      if (t.isIdentifier(argument)) {
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
  param: t.ObjectPattern
): t.ObjectProperty["value"][] {
  return param.properties
    .map((property) => {
      if (t.isRestElement(property)) return property;
      return property.value;
    })
    .filter((el): el is t.ObjectProperty["value"] => el !== null);
}

// 🎭 Component interface

interface MatchingParam {
  isMatch: boolean;
  resolveValue: (args: Value[]) => Value;
}

type Value = t.Node | null;

// 🍂 Leaves

class NoMatch implements MatchingParam {
  isMatch = false;

  resolveValue() {
    return null;
  }
}

class MatchingIdentifier implements MatchingParam {
  private index: number;
  private id: t.Identifier;
  private param: t.Identifier;

  constructor(index: number, id: t.Identifier, param: t.Identifier) {
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

class MatchingAssignment implements MatchingParam {
  private index: number;
  private id: t.Identifier;
  private param: t.AssignmentPattern;

  constructor(index: number, id: t.Identifier, param: t.AssignmentPattern) {
    this.index = index;
    this.id = id;
    this.param = param;
  }

  get isMatch() {
    return (
      t.isIdentifier(this.param.left) && this.id.name === this.param.left.name
    );
  }

  resolveValue(args: Value[]) {
    return args[this.index] || this.param.right;
  }
}

class MatchingRestIdentifier implements MatchingParam {
  private index: number;
  private id: t.Identifier;
  private argument: t.Identifier;
  private omittedIdNames: t.Identifier["name"][];

  constructor(
    index: number,
    params: (t.Node | null)[],
    id: t.Identifier,
    argument: t.Identifier
  ) {
    this.index = index;
    this.id = id;
    this.argument = argument;
    this.omittedIdNames = params
      .filter((param): param is t.Identifier => t.isIdentifier(param))
      .map((param) => param.name);
  }

  get isMatch() {
    return this.id.name === this.argument.name;
  }

  resolveValue(args: Value[]) {
    return t.areAllObjectProperties(args)
      ? this.resolveObjectExpressionValue(args)
      : this.resolveArrayExpressionValue(args);
  }

  private resolveObjectExpressionValue(args: t.ObjectProperty[]): Value {
    const pickedArgs = args.filter(
      (arg) =>
        !(t.isIdentifier(arg.key) && this.omittedIdNames.includes(arg.key.name))
    );

    return t.objectExpression(pickedArgs);
  }

  private resolveArrayExpressionValue(args: Value[]): Value {
    const elements = args.slice(this.index).filter(t.isArrayExpressionElement);
    return t.arrayExpression(elements);
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
    return t.areAllObjectProperties(args)
      ? this.resolveObjectExpressionValue(args)
      : this.resolveArrayExpressionValue(args);
  }

  private resolveObjectExpressionValue(args: t.ObjectProperty[]): Value {
    return this.resolveArrayExpressionValue(args.map((arg) => arg.value));
  }

  private resolveArrayExpressionValue(args: Value[]) {
    const value = args[this.index];
    if (!t.isArrayExpression(value)) return value;
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
    if (!t.isObjectExpression(value)) return value;

    const property = this.child.resolveValue(value.properties);
    if (!t.isObjectProperty(property)) return property;

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
