import { ClassRefactor } from './ClassRefactor';
import { TypescriptClassNode } from './TypescriptClassNode';
import { formatTs } from './formatTs';

describe(ClassRefactor.name, () => {
	describe(ClassRefactor.prototype.extractClass.name, () => {
		it('should extract new class with sended method', () => {
			const source = `
				class Source{
					a(){}
					b(){}
				}
			`;
			const expected = `
				class Extracted{
					a(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should delegate call to new property', () => {
			const source = `
				class Source{
					a(): void {}
					b(): void {}
				}
			`;
			const expected = `
				class Source{
					private extracted: Extracted = new Extracted();

					a(): void {
						return this.extracted.a();
					}
					
					b(): void {}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should add dependency method to new class', () => {
			const source = `
				class Source{
					a(){
						this.b();
					}

					b(){}
				}
			`;
			const expected = `
				class Extracted{
					a(){
						this.b();
					}
					
					b(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should remove private dependency method from source if not used', () => {
			const source = `
				class Source{
					a(){
						this.b();
					}
					
					private	b(){}
				}
		`;
			const expected = `
				class Source{
					private	extracted: Extracted = new Extracted();
					
					a(){
						return this.extracted.a();
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should remove private dependency method from source if not used recursively', () => {
			const source = `
				class Source{
					a(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
		`;
			const expected = `
				class Source{
					private	extracted: Extracted = new Extracted();
					
					a(){
						return this.extracted.a();
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should not remove private dependency method from source if not moved', () => {
			const source = `
				class Source{
					a(){}
					private	b(){}
				}
		`;
			const expected = `
				class Source{
					private	extracted: Extracted = new Extracted();					
					a(){
						return this.extracted.a();
					}
					private	b(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should add dependency methods to extracted class recursively', () => {
			const source = `
				class Source{
					a(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
		`;
			const expected = `
				class Extracted{
					a(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should not add unused private methods to extracted class', () => {
			const source = `
				class Source{
					a(){}

					d(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
		`;
			const expected = `
				class Extracted{
					a(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should mark moved private methods to extracted class as public', () => {
			const source = `
				class Source{
					private a(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}

					d(){}
				}
		`;
			const expected = `
				class Extracted{
					a(){
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should mark moved private dependency methods to extracted class as public', () => {
			const source = `
				class Source{
					private a(){
						this.b();
					}

					d(){
						this.a();
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
		`;
			const expected = `
				class Extracted{
					a(){
						this.b();
					}
					
					b(){
						this.c();
					}

					private c(){}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should delegate moved private methods to extracted class prop', () => {
			const source = `
				class Source{
					private a(){
						this.b();
					}

					d(){
						this.a();
						this.b();
					}
					
					private	b(){
						this.c();
					}

					private c(){}
				}
		`;
			const expected = `
				class Source{
					private extracted: Extracted = new Extracted();

					private a(){
						return this.extracted.a();
					}

					d(){
						this.a();
						this.b();
					}
					
					private	b(){
						return this.extracted.b();
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should create getter for moved property', () => {
			const source = `
				class Source{
					prop:number = 1;
				}
		`;
			const expected = `
				class Source{
					private extracted: Extracted = new Extracted();
					get prop(): number{
						return this.extracted.prop;
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['prop']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should init new class with params', () => {
			const source = `
				class Source{
					constructor(private prop: number){}

					a():void{
						console.log(this.prop);
					}
				}
		`;
			const expected = `
				class Source{
					private extracted: Extracted = new Extracted(this.prop);

					constructor(private prop: number){}

					a():void{
						return	this.extracted.a();
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('should move ctor fields to extracted class if used', () => {
			const source = `
				class Source{
					constructor(private prop: number){}

					a():void{
						console.log(this.prop);
					}
				}
		`;
			const expected = `
				class Extracted{
					constructor(private prop: number){}

					a():void{
						console.log(this.prop);
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedClassRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedClassRefactor).toEqualString(expected);
		});

		it('should not init new class with unused params', () => {
			const source = `
				class Source{
					constructor(private prop: number){}

					a():void{}
				}
		`;
			const expected = `
				class Source{
					private extracted: Extracted = new Extracted();

					constructor(private prop: number){}

					a():void{
						return	this.extracted.a();
					}
				}
			`;
			const classRefactor = createClassRefactor(source);
			classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(classRefactor).toEqualString(expected);
		});

		it('extracted class should not contains source class decorators, static methods, interfaces', () => {
			const source = `
				@Decorator()
				class Source implements ISource{
					static method(){}

					a():void{}
				}
		`;
			const expected = `
				class Extracted{
					a():void{}
				}
			`;
			const classRefactor = createClassRefactor(source);
			const extractedRefactor = classRefactor.extractClass('Extracted', ['a']);
			expectTsClassRefactor(extractedRefactor).toEqualString(expected);
		});
	});
});

function expectTsClassRefactor(classRefactor: ClassRefactor) {
	return {
		toEqualString: (expected: string) =>
			expect(formatTs(classRefactor.serialize())).toBe(formatTs(expected)),
	};
}

function createClassRefactor(source: string): ClassRefactor {
	return new ClassRefactor(TypescriptClassNode.from(source));
}
