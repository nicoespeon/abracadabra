import {
	ClassInstanceMemberTypes,
	Scope,
	MethodDeclaration,
	ParameterDeclaration,
	GetAccessorDeclaration,
	SetAccessorDeclaration,
} from 'ts-morph';

type FieldWithReturnType = MethodDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;

export abstract class UmlNotation {
	static fromInstanceMember(node: ClassInstanceMemberTypes): UmlNotation {
		if (UmlNotation.isFieldWithReturnType(node)) {
			return new MethodUmlNotation(node);
		}
		return new PropertyUmlNotation(node);
	}

	private static isFieldWithReturnType(
		node: ClassInstanceMemberTypes,
	): node is FieldWithReturnType {
		return [MethodDeclaration, GetAccessorDeclaration, SetAccessorDeclaration].some(
			(ctor) => node instanceof ctor,
		);
	}

	static parseFieldNameFromUmlNotation(umlNotation: string): string {
		return umlNotation.match(/\w+/)?.[0] ?? '';
	}

	constructor(protected node: ClassInstanceMemberTypes) {}

	abstract serialize(): string;

	protected getBody(): string {
		return `${this.getScopeSymbol()}${this.node.getName()}`;
	}

	private getScopeSymbol(): string {
		const scope = this.node.getScope();
		return scope === Scope.Public ? '+' : scope === Scope.Protected ? '#' : '-';
	}

	protected getTypeNotationOrEmpty(text?: string): string {
		return text ? `: ${text}` : '';
	}
}

export class PropertyUmlNotation extends UmlNotation {
	constructor(protected node: Exclude<ClassInstanceMemberTypes, FieldWithReturnType>) {
		super(node);
	}

	serialize(): string {
		return `${this.getBody()}${this.getType()}`;
	}

	private getType(): string {
		return this.getTypeNotationOrEmpty(this.node.getTypeNode()?.getText());
	}
}

export class MethodUmlNotation extends UmlNotation {
	constructor(protected node: FieldWithReturnType) {
		super(node);
	}

	serialize(): string {
		return `${this.getBody()}(${this.getParamsNotation()})${this.getReturnType()}`;
	}

	private getParamsNotation(): string {
		return this.node
			.getParameters()
			.map((param) => this.getParamNotation(param))
			.join(', ');
	}

	private getParamNotation(param: ParameterDeclaration): string {
		return `${param.getName()}${this.getTypeNotationOrEmpty(param.getTypeNode()?.getText())}`;
	}

	private getReturnType(): string {
		return this.getTypeNotationOrEmpty(this.node.getReturnTypeNode()?.getText());
	}
}
