export function getRedirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/'

  const { from } = state as { from?: unknown }
  return typeof from === 'string' && from.startsWith('/') ? from : '/'
}
