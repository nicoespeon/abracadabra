import { Path } from "./path";
import { Selection } from "./selection";

export class CodeReference {
  constructor(
    public readonly path: Path,
    public readonly selection: Selection
  ) {}
}
