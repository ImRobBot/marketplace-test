import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  titleId: string
  lead: string
  error: string
  footer: ReactNode
  story: ReactNode
  children: ReactNode
  variant?: 'register'
}

export default function AuthLayout({
  eyebrow,
  title,
  titleId,
  lead,
  error,
  footer,
  story,
  children,
  variant
}: Readonly<AuthLayoutProps>) {
  return (
    <div className={`page-shell auth-page${variant === 'register' ? ' auth-page--register' : ''}`}>
      <section className="auth-card" aria-labelledby={titleId}>
        <Link className="back-link" to="/"><span aria-hidden="true">←</span> Volver al catálogo</Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1 id={titleId}>{title}</h1>
        <p className="auth-card__lead">{lead}</p>

        {error && <div className="form-alert" role="alert">{error}</div>}
        {children}
        <p className="auth-card__footer">{footer}</p>
      </section>
      {story}
    </div>
  )
}
