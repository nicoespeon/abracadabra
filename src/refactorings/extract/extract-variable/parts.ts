import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";

export { Parts };

class Parts {
  constructor(
    private readonly code: Code,
    private readonly selection: Selection,
    private readonly offset: Position
  ) {}

  get left(): Code {
    return this.code.slice(0, this.start);
  }

  get value(): Code {
    return this.code.slice(this.start, this.end);
  }

  get right(): Code {
    return this.code.slice(this.end);
  }

  private get start(): number {
    return this.selection.start.character - this.offset.character;
  }

  private get end(): number {
    return this.selection.end.character - this.offset.character;
  }
}
