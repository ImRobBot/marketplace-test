interface AuthStoryProps {
  art: string
  eyebrow: string
  title: string
  benefits: readonly string[]
  warm?: boolean
}

export default function AuthStory({
  art,
  eyebrow,
  title,
  benefits,
  warm = false
}: AuthStoryProps) {
  return (
    <aside
      className={`auth-story${warm ? ' auth-story--warm' : ''}`}
      aria-label="Beneficios de tu cuenta"
    >
      <div className="auth-story__art" aria-hidden="true"><span>{art}</span></div>
      <span className="eyebrow eyebrow--light">{eyebrow}</span>
      <h2>{title}</h2>
      <ul>
        {benefits.map((benefit, index) => (
          <li key={benefit}>
            <span>{String(index + 1).padStart(2, '0')}</span> {benefit}
          </li>
        ))}
      </ul>
    </aside>
  )
}
