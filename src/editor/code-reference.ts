import { Selection } from "./selection";
import { Path } from "./path";

export class CodeReference {
  constructor(
    public readonly path: Path,
    public readonly selection: Selection
  ) {}
}
