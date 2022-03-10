import { RelativePath } from "../../editor/editor";
import * as t from "../../ast";
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
    private path: t.RootNodePath<t.VariableDeclaration>,
    private id: t.Identifier
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    this._value = path.node;
    const declarationPath = path.get("declarations")[0];
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      declarationPath,
      declarationPath.get("init"),
      [],
      path.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      declarationPath.get("init"),
      path.parentPath
    );
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
      this.path.parentPath,
      this.id,
      relativePath.withoutExtension
    );
    this.path.remove();
  }
}

export class MovableFunctionDeclaration implements MovableNode {
  private _value: t.WithId<t.FunctionDeclaration>;
  private _hasReferencesThatCantBeImported: boolean;
  private _referencedImportDeclarations: t.ImportDeclaration[];

  constructor(
    private path: t.PathWithId<t.RootNodePath<t.FunctionDeclaration>>
  ) {
    // We need to compute these in constructor because the `path` reference
    // will be removed and not accessible later.
    this._value = path.node;
    this._hasReferencesThatCantBeImported = t.hasReferencesDefinedInSameScope(
      path,
      path.get("body"),
      path.node.params,
      path.parentPath
    );
    this._referencedImportDeclarations = t.getReferencedImportDeclarations(
      path.get("body"),
      path.parentPath
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
      this.path.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.path.remove();
  }
}

export class ExportedMovableFunctionDeclaration implements MovableNode {
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

  constructor(private path: t.PathWithId<t.RootNodePath<t.TypeDeclaration>>) {
    this._value = path.node;
    this._hasReferencesThatCantBeImported =
      t.hasTypeReferencesDefinedInSameScope(path);
    this._referencedImportDeclarations = t.getTypeReferencedImportDeclarations(
      path,
      path.parentPath
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
      this.path.parentPath,
      this._value.id,
      relativePath.withoutExtension
    );
    this.path.remove();
  }
}

export class ExportedMovableTSTypeDeclaration implements MovableNode {
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
