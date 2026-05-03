import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FiAlertTriangle, FiInbox, FiLoader } from 'react-icons/fi'

type StateType = 'loading' | 'empty' | 'error'

interface StateCardProps {
  type: StateType
  title: string
  description?: string
  actionText?: string
  actionTo?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

const defaultStyles: Record<StateType, { icon: ReactNode; title: string }> = {
  loading: {
    icon: <FiLoader size={26} className="animate-spin text-primary-500" />,
    title: '加载中',
  },
  empty: {
    icon: <FiInbox size={26} className="text-gray-400" />,
    title: '暂无内容',
  },
  error: {
    icon: <FiAlertTriangle size={26} className="text-red-500" />,
    title: '加载失败',
  },
}

export default function StateCard({
  type,
  title,
  description,
  actionText,
  actionTo,
  onAction,
  icon,
  className = '',
}: StateCardProps) {
  const defaults = defaultStyles[type]
  const finalTitle = title || defaults.title
  const finalIcon = icon || defaults.icon

  return (
    <div className={`card py-12 text-center ${className}`.trim()}>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        {finalIcon}
      </div>
      <p className="text-base font-medium text-gray-700">{finalTitle}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}

      {actionText && actionTo && (
        <Link to={actionTo} className="btn btn-primary mt-4 inline-block">
          {actionText}
        </Link>
      )}

      {actionText && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary mt-4">
          {actionText}
        </button>
      )}
    </div>
  )
}
