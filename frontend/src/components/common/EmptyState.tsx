import type { ElementType, ReactNode } from 'react'

interface EmptyStateProps {
  eyebrow?: ReactNode
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  iconClassName?: string
  headingAs?: 'h1' | 'h2' | 'h3'
  as?: 'div' | 'section'
  bordered?: boolean
  className?: string
  role?: 'alert' | 'status'
}

export default function EmptyState({
  eyebrow,
  title,
  description,
  actions,
  icon,
  iconClassName = '',
  headingAs = 'h2',
  as = 'div',
  bordered = true,
  className = '',
  role
}: Readonly<EmptyStateProps>) {
  const Element: ElementType = as
  const Heading: ElementType = headingAs
  const stateClassName = [
    'empty-state',
    bordered ? 'empty-state--bordered' : '',
    className
  ].filter(Boolean).join(' ')
  const stateIconClassName = ['empty-state__icon', iconClassName].filter(Boolean).join(' ')

  return (
    <Element className={stateClassName} role={role}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {icon !== undefined && (
        <span className={stateIconClassName} aria-hidden="true">{icon}</span>
      )}
      <Heading>{title}</Heading>
      <p>{description}</p>
      {actions && <div className="empty-state__actions">{actions}</div>}
    </Element>
  )
}
