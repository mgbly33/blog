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
    icon: <FiLoader size={22} className="animate-spin text-vermilion" />,
    title: '加载中...',
  },
  empty: {
    icon: <FiInbox size={22} className="text-ink-400" />,
    title: '暂无内容',
  },
  error: {
    icon: <FiAlertTriangle size={22} className="text-rose-500" />,
    title: '加载遇到了问题',
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
    <div className={`card py-14 text-center hover:transform-none ${className}`.trim()}>
      <div className="mx-auto mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-200/80 dark:bg-white/[0.06]">
        {finalIcon}
      </div>
      <p className="font-editorial-serif text-xl font-semibold text-ink-800 dark:text-ink-50">
        {finalTitle}
      </p>
      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-ink-500 dark:text-ink-300 max-w-md mx-auto">
          {description}
        </p>
      )}

      {actionText && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm mt-5 inline-flex">
          {actionText}
        </Link>
      )}

      {actionText && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary btn-sm mt-5">
          {actionText}
        </button>
      )}
    </div>
  )
}
