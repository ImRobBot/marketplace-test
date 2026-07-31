import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ApiErrorResponse } from '../types'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await register(username.trim(), password)
      navigate('/')
    } catch (registerError: unknown) {
      const userExists = axios.isAxiosError<ApiErrorResponse>(registerError)
        && registerError.response?.data.error === 'User exists'
      setError(userExists
        ? 'Ese nombre de usuario ya está en uso. Prueba con otro.'
        : 'No pudimos crear la cuenta. Revisa tus datos e inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell auth-page auth-page--register">
      <section className="auth-card" aria-labelledby="register-title">
        <Link className="back-link" to="/"><span aria-hidden="true">←</span> Volver al catálogo</Link>
        <span className="eyebrow">Registro</span>
        <h1 id="register-title">Crea tu cuenta.</h1>
        <p className="auth-card__lead">
          Solo necesitas un usuario y una contraseña para empezar.
        </p>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label className="form-field" htmlFor="register-username">
            <span>Usuario</span>
            <input
              id="register-username"
              name="username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="Elige un nombre de usuario"
              required
            />
          </label>
          <label className="form-field" htmlFor="register-password">
            <span>Contraseña</span>
            <input
              id="register-password"
              name="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              required
            />
          </label>
          <p className="form-hint">
            Usa una contraseña que puedas recordar para esta demostración.
          </p>
          <button className="button button--wide" type="submit" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>

      <aside className="auth-story auth-story--warm" aria-label="Qué obtienes con tu cuenta">
        <div className="auth-story__art" aria-hidden="true"><span>01</span></div>
        <span className="eyebrow eyebrow--light">Empieza aquí</span>
        <h2>Una compra sencilla desde el primer vistazo.</h2>
        <ul>
          <li><span>01</span> Explora una selección fácil de entender</li>
          <li><span>02</span> Ajusta cantidades desde tu carrito</li>
          <li><span>03</span> Completa una compra de demostración</li>
        </ul>
      </aside>
    </div>
  )
}
