export function first<T>(array: T[] | ReadonlyArray<T>): T | undefined {
  return array[0];
}

export function last<T>(array: T[] | ReadonlyArray<T>): T | undefined {
  return array[array.length - 1];
}

export function allButLast<T>(array: T[]): T[] {
  return array.slice(0, -1);
}

export function isLast<T>(array: Array<T>, index: number): boolean {
  return array.length - 1 === index;
}
