interface ReadingProgressBarProps {
  progress: number
}

/**
 * 固定在页面顶部的阅读进度条
 */
export default function ReadingProgressBar({ progress }: ReadingProgressBarProps) {
  if (progress <= 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
