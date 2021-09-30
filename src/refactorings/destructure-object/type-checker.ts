import * as ts from "typescript";
import {
  createDefaultMapFromNodeModules,
  createSystem,
  createVirtualLanguageServiceHost
} from "@typescript/vfs";

import { Code } from "../../editor/editor";
import { Position } from "../../editor/position";
import { TSPosition } from "./ts-position";

export class TypeChecker {
  private fileName = "irrelevant.ts";
  private UNRESOLVED_TYPE = "{}";

  constructor(private readonly code: Code) {}

  getKeys(position: Position): string[] {
    const program = this.createTSProgram();
    if (!program) return [];

    const node = this.getNodeAtPosition(
      new TSPosition(this.code, position),
      program
    );
    if (!node) return [];

    const typeChecker = program.getTypeChecker();
    const type = typeChecker.getTypeAtLocation(node);

    return type
      .getProperties()
      .filter(
        (property) =>
          type.isClassOrInterface() ||
          property.flags === ts.SymbolFlags.Property
      )
      .map((property) => property.name);
  }

  getTypeAt(position: Position): Type {
    return this.getTypeAtPosition(new TSPosition(this.code, position));
  }

  private getTypeAtPosition(position: TSPosition): Type {
    const ANY_TYPE: Type = "any";

    const program = this.createTSProgram();
    if (!program) return ANY_TYPE;

    let type = this.getTypeAtPositionWithProgram(position, program);

    // Current implementation of TS Program can't resolve certain types
    // like `string[]`, it returns `{}` instead.
    // In this scenario, fallback on the VFS approach that seems to work.
    if (type === this.UNRESOLVED_TYPE) {
      const program = this.createTSProgramWithVirtualFileSystem();
      if (!program) return ANY_TYPE;

      type = this.getTypeAtPositionWithProgram(position, program);
    }

    return type || ANY_TYPE;
  }

  private getTypeAtPositionWithProgram(
    position: TSPosition,
    program: ts.Program
  ): Type | undefined {
    const node = this.getNodeAtPosition(position, program);
    if (!node) return;

    const typeChecker = program.getTypeChecker();

    const type = typeChecker.getTypeAtLocation(node);
    return this.normalizeType(typeChecker.typeToString(type));
  }

  private normalizeType(type: Type): Type {
    if (type === this.UNRESOLVED_TYPE) return type;

    type = type.replace("typeof ", "");

    try {
      /**
       * When inferred type is a narrow type literal, we get the generic type.
       *
       * The type literal is more accurate, but in practice we generate code
       * from one example. We usually want to generalize to the generic type.
       *
       * E.g. `functionToCreate("Oops, something went wrong");`
       *      => `functionToCreate(message: string)`
       */
      return typeof eval(type);
    } catch {
      // `type` couldn't be evaluated, fallback on its value.
      return type;
    }
  }

  private getNodeAtPosition(
    position: TSPosition,
    program: ts.Program
  ): ts.Node | undefined {
    try {
      // @ts-ignore Internal method
      return ts.getTouchingPropertyName(
        program.getSourceFile(this.fileName),
        position.value
      );
    } catch (error) {
      // TODO: do use a logger so we don't console.log in tests
      // Since we're using internal methods, we can't rely on type checking.
      console.error("Failed to get TS node", {
        error,
        code: this.code,
        position: position.value
      });
      return;
    }
  }

  private createTSProgram(): ts.Program | undefined {
    const host: ts.CompilerHost = {
      ...ts.createCompilerHost({}),
      getSourceFile: (fileName, languageVersion) =>
        ts.createSourceFile(fileName, this.code, languageVersion)
    };

    return ts.createProgram([this.fileName], {}, host);
  }

  private createTSProgramWithVirtualFileSystem(): ts.Program | undefined {
    const languageServiceHost = this.createTSLanguageServiceHost();
    const languageServer = ts.createLanguageService(languageServiceHost);
    return languageServer.getProgram();
  }

  private createTSLanguageServiceHost(): ts.LanguageServiceHost {
    const tsCompilerOptions = {};

    const fsMap = createDefaultMapFromNodeModules(tsCompilerOptions);
    fsMap.set(this.fileName, this.code);

    const system = createSystem(fsMap);
    const { languageServiceHost } = createVirtualLanguageServiceHost(
      system,
      [this.fileName],
      tsCompilerOptions,
      ts
    );

    return languageServiceHost;
  }
}

type Type = string;
