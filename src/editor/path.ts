export { Path };

class Path {
  constructor(readonly value: string) {}

  get withoutExtension(): string {
    return this.value.replace(/\.\w+$/, "");
  }
}
