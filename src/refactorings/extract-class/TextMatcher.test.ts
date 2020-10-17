import { TextMatcher } from "./TextMatcher";
import { classNameMatcher } from "./classNameMatcher";

describe(TextMatcher.name, () => {
  it('should find class name word after "class" pattern', () => {
    const source = "class ClassName {}";
    expect(classNameMatcher.findAt(source)).toBe("ClassName");
  });
});
