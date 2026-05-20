/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate the half value (rounded down) for a characteristic
 */
export function halfValue(value: number): number {
  return Math.floor(value / 2)
}

/**
 * Calculate the fifth value (rounded down) for a characteristic
 */
export function fifthValue(value: number): number {
  return Math.floor(value / 5)
}

/**
 * Format a number with sign prefix (+/-)
 */
export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}
