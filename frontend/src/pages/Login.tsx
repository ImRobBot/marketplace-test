import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getRedirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/'

  const { from } = state as { from?: unknown }
  return typeof from === 'string' && from.startsWith('/') ? from : '/'
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(username.trim(), password)
      navigate(getRedirectTarget(location.state))
    } catch {
      setError('El usuario o la contraseña no coinciden. Revisa tus datos e inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="back-link" to="/"><span aria-hidden="true">←</span> Volver al catálogo</Link>
        <span className="eyebrow">Login</span>
        <h1 id="login-title">Qué gusto verte de nuevo.</h1>
        <p className="auth-card__lead">
          Ingresa para recuperar tu carrito y continuar donde te quedaste.
        </p>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label className="form-field" htmlFor="login-username">
            <span>Usuario</span>
            <input
              id="login-username"
              name="username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="Tu nombre de usuario"
              required
            />
          </label>
          <label className="form-field" htmlFor="login-password">
            <span>Contraseña</span>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
            />
          </label>
          <button className="button button--wide" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿Sin cuenta? <Link to="/register">Regístrate gratis</Link>
        </p>
      </section>

      <aside className="auth-story" aria-label="Beneficios de tu cuenta">
        <div className="auth-story__art" aria-hidden="true"><span>M</span></div>
        <span className="eyebrow eyebrow--light">Tu espacio</span>
        <h2>Todo lo que elegiste, en un solo lugar.</h2>
        <ul>
          <li><span>01</span> Conserva tu carrito entre visitas</li>
          <li><span>02</span> Consulta stock antes de comprar</li>
          <li><span>03</span> Prueba el checkout sin cargos reales</li>
        </ul>
      </aside>
    </div>
  )
}
