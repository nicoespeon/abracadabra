import { ClassNode, InstanceMember } from "./class-node";
import {
  ClassDeclaration,
  ClassInstanceMemberTypes,
  MethodDeclaration,
  Scope,
  PropertyDeclaration,
  ParameterDeclaration
} from "ts-morph";
import { camelCase } from "change-case";
import { parseClassDeclaration } from "./parse-class-declaration";

export class TypescriptClassNode implements ClassNode {
  static from(source: string): TypescriptClassNode {
    const node = parseClassDeclaration(source);
    return new TypescriptClassNode(node);
  }

  get name(): string {
    return this.node.getName() ?? "";
  }

  constructor(private node: ClassDeclaration) {}

  getInstanceMembers(): InstanceMember[] {
    return this.node
      .getInstanceMembers()
      .map((field) => TypescriptInstanceMemberCode.create(field));
  }

  getInstanceMember(fieldName: string): InstanceMember {
    return TypescriptInstanceMemberCode.create(
      this.node.getInstanceMemberOrThrow(fieldName)
    );
  }

  initPrivatePropertyFor(classNode: TypescriptClassNode): InstanceMember {
    const prop = this.node.addProperty({
      scope: Scope.Private,
      name: camelCase(classNode.name),
      type: classNode.name,
      initializer: `new ${classNode.name}(${classNode
        .getCtorParams()
        .map((param) => `this.${param.getName()}`)
        .join(", ")})`,
      trailingTrivia: "\n\n"
    });
    prop.setOrder(0);
    return TypescriptInstanceMemberCode.create(prop);
  }

  private getCtorParams(): ParameterDeclaration[] {
    return this.node.getConstructors()[0]?.getParameters() ?? [];
  }

  createClassNodeWithSameInstanceMembers(name: string): ClassNode {
    const clone = TypescriptClassNode.from(
      this.serialize().replace(/class \w+/, `class ${name}`)
    );
    clone.node.getStaticMembers().forEach((field) => field.remove());
    clone.node.getDecorators().forEach((field) => field.remove());
    clone.removeAllImplements();
    return clone;
  }

  private removeAllImplements(): void {
    while (this.node.getImplements().length) {
      this.node.removeImplements(0);
    }
  }

  serialize(): string {
    return this.node.getFullText();
  }
}

export class TypescriptInstanceMemberCode implements InstanceMember {
  static create(node: ClassInstanceMemberTypes): TypescriptInstanceMemberCode {
    if (node instanceof MethodDeclaration) {
      return new TypescriptMethodCode(node);
    }
    if (node instanceof PropertyDeclaration) {
      return new TypescriptPropertyCode(node);
    }
    if (node instanceof ParameterDeclaration) {
      return new TypescriptParameterCode(node);
    }
    return new TypescriptInstanceMemberCode(node);
  }

  get name(): string {
    return this.node.getName();
  }

  constructor(protected node: ClassInstanceMemberTypes) {}

  isPrivate(): boolean {
    return this.node.getScope() === Scope.Private;
  }

  markAsPublic(): void {
    this.node.setScope(undefined);
  }

  getDependencyNames(): string[] {
    return this.node.getFullText().match(/(?<=this\.)\w+/g) ?? [];
  }

  delegateTo(_field: InstanceMember): void {}

  remove(): void {
    this.node.remove();
  }
}

export class TypescriptPropertyCode extends TypescriptInstanceMemberCode {
  constructor(protected node: PropertyDeclaration) {
    super(node);
  }

  delegateTo(field: InstanceMember): void {
    const index = this.node.getChildIndex();
    const params = {
      name: this.name,
      scope: this.node.getScope().replace(Scope.Public, "") as Scope,
      returnType: this.node.getTypeNode()?.getText(),
      statements: `return this.${field.name}.${this.name}`
    };
    const parent = this.node.getParentOrThrow();
    this.node.remove();
    this.node = parent.addGetAccessor(params) as any;
    this.node.setOrder(index);
  }
}

export class TypescriptParameterCode extends TypescriptInstanceMemberCode {
  markAsPublic(): void {}
}

export class TypescriptMethodCode extends TypescriptInstanceMemberCode {
  constructor(protected node: MethodDeclaration) {
    super(node);
  }

  getDependencyNames(): string[] {
    return (
      this.node
        .getBody()
        ?.getFullText()
        .match(/(?<=this\.)\w+/g) ?? []
    );
  }

  delegateTo(field: InstanceMember): void {
    this.node.setBodyText(
      `return this.${field.name}.${
        this.name
      }(${this.node.getParameters().map((param) => param.getName())})`
    );
  }
}
