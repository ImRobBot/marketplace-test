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
}: FeedbackNoticeProps) {
  if (!feedback) return null

  return (
    <div
      className={`notice notice--${feedback.type}`}
      role={feedback.type === 'error' ? 'alert' : 'status'}
    >
      <span>{feedback.message}</span>
      {actionLabel && actionTo && <Link to={actionTo}>{actionLabel}</Link>}
    </div>
  )
}
