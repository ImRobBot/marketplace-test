import { Link } from 'react-router-dom'
import type { Feedback } from '../../types'

interface FeedbackNoticeProps {
  feedback: Feedback | null
  actionLabel?: string
  actionTo?: string
}

export default function FeedbackNotice({
  feedback,
  actionLabel,
  actionTo
}: Readonly<FeedbackNoticeProps>) {
  if (!feedback) return null

  if (feedback.type === 'error') {
    return (
      <div className="notice notice--error" role="alert">
        <span>{feedback.message}</span>
        {actionLabel && actionTo && <Link to={actionTo}>{actionLabel}</Link>}
      </div>
    )
  }

  return (
    <output className="notice notice--success" aria-live="polite">
      <span>{feedback.message}</span>
      {actionLabel && actionTo && <Link to={actionTo}>{actionLabel}</Link>}
    </output>
  )
}
