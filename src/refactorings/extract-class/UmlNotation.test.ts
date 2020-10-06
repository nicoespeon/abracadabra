import { UmlNotation, MethodUmlNotation, PropertyUmlNotation } from './UmlNotation';
import { parseClassDeclaration } from './parseClassDeclaration';

describe(PropertyUmlNotation.name, () => {
	describe(PropertyUmlNotation.prototype.serialize.name, () => {
		it('should parse public prop', () => {
			const field = create(`prop: Type`);
			expect(field.serialize()).toBe('+prop: Type');
		});

		it('should parse private prop', () => {
			const field = create(`private prop: Type`);
			expect(field.serialize()).toBe('-prop: Type');
		});

		it('should parse protected prop', () => {
			const field = create(`protected prop: Type`);
			expect(field.serialize()).toBe('#prop: Type');
		});

		it('should parse prop without type', () => {
			const field = create(`protected prop`);
			expect(field.serialize()).toBe('#prop');
		});

		it('should parse prop without type with initializer', () => {
			const field = create(`prop = 1`);
			expect(field.serialize()).toBe('+prop');
		});

		it('should parse prop with generic type', () => {
			const field = create(`prop : Promise<void> `);
			expect(field.serialize()).toBe('+prop: Promise<void>');
		});

		it('should parse ctor parameter type', () => {
			const classBody = `class A { constructor(private prop: Type){} }`;
			const field = UmlNotation.fromInstanceMember(
				parseClassDeclaration(classBody).getInstanceMembers()[0],
			);
			expect(field.serialize()).toBe('-prop: Type');
		});
	});
});

describe(MethodUmlNotation.name, () => {
	describe(MethodUmlNotation.prototype.serialize.name, () => {
		it('should parse public method', () => {
			const field = create(`method(){}`);
			expect(field.serialize()).toBe('+method()');
		});

		it('should parse private method', () => {
			const field = create(`private method(){}`);
			expect(field.serialize()).toBe('-method()');
		});

		it('should parse method with return type', () => {
			const field = create(`method():Type{}`);
			expect(field.serialize()).toBe('+method(): Type');
		});

		it('should parse method with param', () => {
			const field = create(`method(param){}`);
			expect(field.serialize()).toBe('+method(param)');
		});

		it('should parse method with typed param', () => {
			const field = create(`method(param: Param){}`);
			expect(field.serialize()).toBe('+method(param: Param)');
		});

		it('should parse method with typed params', () => {
			const field = create(`method(param: Param1, param2:Param2):Param3{}`);
			expect(field.serialize()).toBe('+method(param: Param1, param2: Param2): Param3');
		});

		it('should parse method with generic type', () => {
			const field = create(`method(): Promise<void> {}`);
			expect(field.serialize()).toBe('+method(): Promise<void>');
		});
	});
});

function create(code: string): UmlNotation {
	const classBody = `class A{${code}}`;
	return UmlNotation.fromInstanceMember(parseClassDeclaration(classBody).getInstanceMembers()[0]);
}
