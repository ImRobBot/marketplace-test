import type { FormEventHandler } from 'react'

interface CredentialsFormProps {
  idPrefix: 'login' | 'register'
  username: string
  password: string
  usernamePlaceholder: string
  passwordPlaceholder: string
  passwordAutoComplete: 'current-password' | 'new-password'
  passwordHint?: string
  passwordMinLength?: number
  passwordMaxLength?: number
  submitting: boolean
  hasError: boolean
  submitLabel: string
  submittingLabel: string
  onUsernameChange: (username: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export default function CredentialsForm({
  idPrefix,
  username,
  password,
  usernamePlaceholder,
  passwordPlaceholder,
  passwordAutoComplete,
  passwordHint,
  passwordMinLength,
  passwordMaxLength,
  submitting,
  hasError,
  submitLabel,
  submittingLabel,
  onUsernameChange,
  onPasswordChange,
  onSubmit
}: Readonly<CredentialsFormProps>) {
  const usernameId = `${idPrefix}-username`
  const passwordId = `${idPrefix}-password`
  const passwordHintId = `${idPrefix}-password-hint`

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="form-field" htmlFor={usernameId}>
        <span>Usuario</span>
        <input
          id={usernameId}
          name="username"
          value={username}
          onChange={event => onUsernameChange(event.target.value)}
          autoComplete="username"
          placeholder={usernamePlaceholder}
          aria-invalid={hasError}
          required
        />
      </label>
      <label className="form-field" htmlFor={passwordId}>
        <span>Contraseña</span>
        <input
          id={passwordId}
          name="password"
          type="password"
          value={password}
          onChange={event => onPasswordChange(event.target.value)}
          autoComplete={passwordAutoComplete}
          placeholder={passwordPlaceholder}
          minLength={passwordMinLength}
          maxLength={passwordMaxLength}
          aria-describedby={passwordHint ? passwordHintId : undefined}
          aria-invalid={hasError}
          required
        />
      </label>
      {passwordHint && <p className="form-hint" id={passwordHintId}>{passwordHint}</p>}
      <button className="button button--wide" type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
