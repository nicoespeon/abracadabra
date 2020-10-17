export class TextMatcher {
  constructor(private pattern: string = "") {}

  after(pattern: string): TextMatcher {
    return new TextMatcher(this.pattern + `(?<=${pattern}\\s*)`);
  }

  getWord(): TextMatcher {
    return new TextMatcher(this.pattern + "\\w+");
  }

  findAt(source: string): string | undefined {
    return source.match(this.toRegExp())?.[0];
  }

  toRegExp(): RegExp {
    return new RegExp(this.pattern);
  }
}
