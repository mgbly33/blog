interface ReadingProgressBarProps {
  progress: number
}

export default function ReadingProgressBar({ progress }: ReadingProgressBarProps) {
  if (progress <= 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-vermilion transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
