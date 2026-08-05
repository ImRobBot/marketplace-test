export function clampQuantity(value: number | string, stock: number): number {
  const parsedValue = Number(value)
  const maximum = Math.max(stock, 1)
  return Math.min(Math.max(parsedValue || 1, 1), maximum)
}
