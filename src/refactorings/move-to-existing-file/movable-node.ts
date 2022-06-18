import * as t from "../../ast";
import { RelativePath } from "../../editor/editor";
import { ExportDeclaration } from "./export-declaration";

export interface MovableNode {
  readonly value: t.Declaration | null;
  readonly hasReferencesThatCantBeImported: boolean;
  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[];
  removeFrom(filePath: RelativePath): void;
}

export class MovableEmptyStatement implements MovableNode {
  readonly value = null;
  readonly hasReferencesThatCantBeImported = false;

  declarationsToImportFrom(_relativePath: RelativePath): t.ImportDeclaration[] {
    return [];
  }

  removeFrom() {}
}

export class MovableVariableDeclaration implements MovableNode {
  private _value: t.VariableDeclaration;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    path: t.NodePath<t.VariableDeclaration>,
    private id: t.Identifier,
    private exportDeclaration: ExportDeclaration
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    const declarationPath = path.get("declarations")[0];
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      declarationPath,
      declarationPath.get("init"),
      [],
      exportDeclaration.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      declarationPath.get("init"),
      exportDeclaration.parentPath
    );

    const declarationWithoutType = path.node;
    declarationWithoutType.declarations[0].id = t.cloneWithoutType(
      declarationPath.get("id").node
    );
    this._value = declarationWithoutType;
  }

  get value(): t.VariableDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.exportDeclaration.parentPath,
      this.id,
      relativePath.withoutExtension
    );
    this.exportDeclaration.replaceWith(this.id);
  }
}

export class MovableFunctionDeclaration implements MovableNode {
  private _value: t.WithId<t.FunctionDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    path: t.PathWithId<t.NodePath<t.FunctionDeclaration>>,
    private exportDeclaration: ExportDeclaration
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    this._value = path.node;
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      path,
      path.get("body"),
      path.node.params,
      exportDeclaration.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      path.get("body"),
      exportDeclaration.parentPath
    );
  }

  get value(): t.FunctionDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.exportDeclaration.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.exportDeclaration.replaceWith(this._value.id);
  }
}

export class MovableTSTypeDeclaration implements MovableNode {
  private _value: t.WithId<t.TypeDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    path: t.PathWithId<t.NodePath<t.TypeDeclaration>>,
    private exportedDeclaration: ExportDeclaration
  ) {
    this._value = path.node;
    this._hasReferencesThatCantBeImported =
      t.hasTypeReferencesDefinedInSameScope(path);
    this._referencedImportDeclarations = t.getTypeReferencedImportDeclarations(
      path,
      exportedDeclaration.parentPath
    );
  }

  get value(): t.TypeDeclaration {
    return this._value;
  }

  get hasReferencesThatCantBeImported(): boolean {
    return this._hasReferencesThatCantBeImported;
  }

  declarationsToImportFrom(relativePath: RelativePath): t.ImportDeclaration[] {
    return this._referencedImportDeclarations.map((declaration) => {
      const importRelativePath = new RelativePath(
        declaration.source.value
      ).relativeTo(relativePath);

      return {
        ...declaration,
        source: {
          ...declaration.source,
          value: importRelativePath.value
        }
      };
    });
  }

  removeFrom(relativePath: RelativePath) {
    t.addImportDeclaration(
      this.exportedDeclaration.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.exportedDeclaration.replaceWith(this._value.id);
  }
}
