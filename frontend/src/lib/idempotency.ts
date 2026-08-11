export function createIdempotencyKey(
  cryptoApi: Crypto | null | undefined = globalThis.crypto
): string {
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  if (typeof cryptoApi?.getRandomValues !== 'function') {
    throw new Error('Secure random generation is unavailable')
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  const value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')

  return `checkout-${value}`
}
