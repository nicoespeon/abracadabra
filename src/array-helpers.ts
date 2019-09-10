export { last, allButLast };

function last<T>(array: T[] | ReadonlyArray<T>): T | undefined {
  return array[array.length - 1];
}

function allButLast<T>(array: T[]): T[] {
  return array.slice(0, -1);
}
