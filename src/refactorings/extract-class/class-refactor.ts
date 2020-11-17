import { ClassNode, InstanceMember } from "./class-node";

export class ClassRefactor {
  constructor(private node: ClassNode) {}

  extractClass(className: string, fieldNames: string[]): ClassRefactor {
    const extractingNode = this.node.createClassNodeWithSameInstanceMembers(
      className
    );
    const extracted = new ExtractingClassRefactor(
      this.node,
      extractingNode,
      fieldNames
    );
    const source = new SourceClassRefactor(this.node, extractingNode);
    extracted.removeFieldsOmitExtractingWithDependencies();
    source.delegateCallsToExtractedClass();
    source.deleteUnusedPrivateMovedFields();
    extracted.markDelegatedFieldsAsPublic();
    return new ClassRefactor(extractingNode);
  }

  serialize(): string {
    return this.node.serialize();
  }
}

class ExtractingClassRefactor {
  constructor(
    private sourceNode: ClassNode,
    private clonedNode: ClassNode,
    private fieldsToExtract: string[]
  ) {}

  removeFieldsOmitExtractingWithDependencies(): void {
    const allFields = this.clonedNode.getInstanceMembers();
    const dependencyFieldNames = this.fieldsToExtract.flatMap((fieldName) =>
      this.getFieldDependenciesRecursively(fieldName)
    );
    const usedFieldNames = new Set([
      ...this.fieldsToExtract,
      ...dependencyFieldNames
    ]);
    const fieldsToRemove = allFields.filter(
      (field) => !usedFieldNames.has(field.name)
    );
    fieldsToRemove.forEach((field) => field.remove());
  }

  private getFieldDependenciesRecursively(fieldName: string): string[] {
    return new FieldDependencies(this.clonedNode, fieldName).getAll();
  }

  markDelegatedFieldsAsPublic(): void {
    const existingFieldNames = new Set(
      this.sourceNode.getInstanceMembers().map((field) => field.name)
    );
    const fieldsToExtract = new Set(this.fieldsToExtract);
    this.clonedNode
      .getInstanceMembers()
      .filter(
        (field) =>
          fieldsToExtract.has(field.name) || existingFieldNames.has(field.name)
      )
      .forEach((field) => field.markAsPublic());
  }
}

class FieldDependencies {
  private dependencies: Set<string> = new Set();

  constructor(private node: ClassNode, fieldName: string) {
    this.fillDependenciesRecursively(fieldName);
  }

  getAll(): string[] {
    return [...this.dependencies.values()];
  }

  private fillDependenciesRecursively(fieldName: string): void {
    this.node
      .getInstanceMember(fieldName)
      .getDependencyNames()
      .filter((name) => !this.dependencies.has(name))
      .forEach((name) => {
        this.dependencies.add(name);
        this.fillDependenciesRecursively(name);
      });
  }
}

class SourceClassRefactor {
  constructor(
    private sourceNode: ClassNode,
    private extractedNode: ClassNode
  ) {}

  delegateCallsToExtractedClass(): void {
    const extractedClassProp = this.sourceNode.initPrivatePropertyFor(
      this.extractedNode
    );
    this.extractedNode
      .getInstanceMembers()
      .map((field) => this.sourceNode.getInstanceMember(field.name))
      .forEach((field) => field.delegateTo(extractedClassProp));
  }

  deleteUnusedPrivateMovedFields(): void {
    const fieldsToRemove = this.getUnusedPrivateMovedFields();
    fieldsToRemove.forEach((field) => field.remove());
    if (this.getUnusedPrivateMovedFields().length) {
      this.deleteUnusedPrivateMovedFields();
    }
  }

  private getUnusedPrivateMovedFields(): InstanceMember[] {
    const allFields = this.sourceNode.getInstanceMembers();
    const usedFieldNames = new Set(
      allFields.flatMap((field) => field.getDependencyNames())
    );
    const extractedFieldNames = new Set(this.getExtractedFieldNames());
    return allFields
      .filter((field) => field.isPrivate())
      .filter((field) => !usedFieldNames.has(field.name))
      .filter((field) => extractedFieldNames.has(field.name));
  }

  private getExtractedFieldNames(): string[] {
    return this.extractedNode.getInstanceMembers().map((field) => field.name);
  }
}
