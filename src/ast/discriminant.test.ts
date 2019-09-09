import * as t from "@babel/types";

import { getDiscriminantFrom } from "./discriminant";

describe("AST Discriminant", () => {
  it("should return null if given expression is null", () => {
    const expression = t.nullLiteral();

    const discriminant = getDiscriminantFrom(expression);

    expect(discriminant).toBe(null);
  });

  it("should return the identifier of given binary expression when it's on the left", () => {
    const name = t.identifier("name");
    const expression = t.binaryExpression("===", name, t.stringLiteral("John"));

    const discriminant = getDiscriminantFrom(expression);

    expect(discriminant).toBe(name);
  });

  it("should return the identifier of given binary expression when it's on the right", () => {
    const name = t.identifier("name");
    const expression = t.binaryExpression("===", t.stringLiteral("John"), name);

    const discriminant = getDiscriminantFrom(expression);

    expect(discriminant).toBe(name);
  });

  it("should return the left identifier of given binary expression when both nodes are identifiers", () => {
    const john = t.identifier("john");
    const expression = t.binaryExpression("===", john, t.identifier("name"));

    const discriminant = getDiscriminantFrom(expression);

    expect(discriminant).toBe(john);
  });
});
