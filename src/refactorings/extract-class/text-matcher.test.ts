import { TextMatcher } from "./text-matcher";
import { classNameMatcher } from "./class-name-matcher";

describe(TextMatcher.name, () => {
  it('should find class name word after "class" pattern', () => {
    const source = "class ClassName {}";
    expect(classNameMatcher.findAt(source)).toBe("ClassName");
  });
});
