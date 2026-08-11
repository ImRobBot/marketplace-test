export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
const REDIRECT_BASE_URL = 'https://marketplace.invalid'

export function getPasswordValidationError(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`
  }

  return ''
}

export function getRedirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/'

  const { from } = state as { from?: unknown }
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.includes('\\')) {
    return '/'
  }

  const target = new URL(from, REDIRECT_BASE_URL)
  return target.origin === REDIRECT_BASE_URL ? from : '/'
}
