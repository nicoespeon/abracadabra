export { first, last, allButLast, isLast };

function first<T>(array: T[] | ReadonlyArray<T>): T | undefined {
  return array[0];
}

function last<T>(array: T[] | ReadonlyArray<T>): T | undefined {
  return array[array.length - 1];
}

function allButLast<T>(array: T[]): T[] {
  return array.slice(0, -1);
}

function isLast<T>(array: Array<T>, index: number): boolean {
  return array.length - 1 === index;
}
