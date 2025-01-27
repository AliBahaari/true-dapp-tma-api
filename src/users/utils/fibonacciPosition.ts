export function fibonacciPosition(num: number) {
  let a = 1,
    b = 2,
    position = 2;
  if (num === 1) return 2;

  while (b < num) {
    [a, b] = [b, a + b];
    position++;
  }

  if (b === num) return position;

  return position - 1;
}
