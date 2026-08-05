import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthStory from '../components/auth/AuthStory'
import CredentialsForm from '../components/auth/CredentialsForm'
import { useAuth } from '../context/AuthContext'
import { getRedirectTarget } from '../lib/auth'

const loginBenefits = [
  'Conserva tu carrito entre visitas',
  'Consulta stock antes de comprar',
  'Prueba el checkout sin cargos reales'
] as const

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
    <AuthLayout
      eyebrow="Login"
      title="Qué gusto verte de nuevo."
      titleId="login-title"
      lead="Ingresa para recuperar tu carrito y continuar donde te quedaste."
      error={error}
      footer={<>¿Sin cuenta? <Link to="/register">Regístrate gratis</Link></>}
      story={(
        <AuthStory
          art="M"
          eyebrow="Tu espacio"
          title="Todo lo que elegiste, en un solo lugar."
          benefits={loginBenefits}
        />
      )}
    >
      <CredentialsForm
        idPrefix="login"
        username={username}
        password={password}
        usernamePlaceholder="Tu nombre de usuario"
        passwordPlaceholder="Tu contraseña"
        passwordAutoComplete="current-password"
        submitting={submitting}
        hasError={Boolean(error)}
        submitLabel="Entrar"
        submittingLabel="Ingresando…"
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={submit}
      />
    </AuthLayout>
  )
}
