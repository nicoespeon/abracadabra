import { TypescriptClassNode } from "./typescript-class-node";

describe(TypescriptClassNode.name, () => {
  describe(
    TypescriptClassNode.prototype.createClassNodeWithSameInstanceMembers.name,
    () => {
      it("should clone class node without interfaces", () => {
        const source = "class Source implements ISource, ISource2 {}";
        const expected = "class Clone {}";
        const node = TypescriptClassNode.from(source);
        const nodeClone = node.createClassNodeWithSameInstanceMembers("Clone");
        expect(nodeClone.serialize()).toBe(expected);
      });
    }
  );
});
