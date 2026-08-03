import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import AuthStory from '../components/auth/AuthStory'
import CredentialsForm from '../components/auth/CredentialsForm'
import { useAuth } from '../context/AuthContext'
import type { ApiErrorResponse } from '../types'

const registerBenefits = [
  'Explora una selección fácil de entender',
  'Ajusta cantidades desde tu carrito',
  'Completa una compra de demostración'
] as const

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
    <AuthLayout
      variant="register"
      eyebrow="Registro"
      title="Crea tu cuenta."
      titleId="register-title"
      lead="Solo necesitas un usuario y una contraseña para empezar."
      error={error}
      footer={<>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></>}
      story={(
        <AuthStory
          warm
          art="01"
          eyebrow="Empieza aquí"
          title="Una compra sencilla desde el primer vistazo."
          benefits={registerBenefits}
        />
      )}
    >
      <CredentialsForm
        idPrefix="register"
        username={username}
        password={password}
        usernamePlaceholder="Elige un nombre de usuario"
        passwordPlaceholder="Crea una contraseña"
        passwordAutoComplete="new-password"
        passwordHint="Usa una contraseña que puedas recordar para esta demostración."
        submitting={submitting}
        hasError={Boolean(error)}
        submitLabel="Crear cuenta"
        submittingLabel="Creando cuenta…"
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={submit}
      />
    </AuthLayout>
  )
}
