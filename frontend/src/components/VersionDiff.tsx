import { useMemo } from 'react'
import { diffLines, diffWords, Change } from 'diff'

interface VersionDiffProps {
  oldTitle: string
  newTitle: string
  oldContent: string
  newContent: string
  oldVersion: number
  newVersion: number
  mode?: 'unified' | 'side-by-side'
}

export default function VersionDiff({
  oldTitle,
  newTitle,
  oldContent,
  newContent,
  oldVersion,
  newVersion,
  mode = 'unified',
}: VersionDiffProps) {
  const titleDiff = useMemo(() => diffWords(oldTitle, newTitle), [oldTitle, newTitle])
  const contentDiff = useMemo(() => diffLines(oldContent, newContent), [oldContent, newContent])

  // 统计变更
  const stats = useMemo(() => {
    let additions = 0
    let deletions = 0
    contentDiff.forEach((part) => {
      const lines = part.value.split('\n').filter(Boolean).length
      if (part.added) additions += lines
      if (part.removed) deletions += lines
    })
    return { additions, deletions }
  }, [contentDiff])

  const hasChanges = titleDiff.some(p => p.added || p.removed) || contentDiff.some(p => p.added || p.removed)

  if (!hasChanges) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>两个版本内容完全相同</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 变更统计 */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">
          版本 {oldVersion} → 版本 {newVersion}
        </span>
        <span className="text-green-600 font-medium">+{stats.additions} 行</span>
        <span className="text-red-600 font-medium">-{stats.deletions} 行</span>
      </div>

      {/* 标题变更 */}
      {titleDiff.some(p => p.added || p.removed) && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">标题变更</div>
          <div className="p-4 text-sm">
            {titleDiff.map((part, i) => (
              <span
                key={i}
                className={
                  part.added
                    ? 'bg-green-100 text-green-800'
                    : part.removed
                    ? 'bg-red-100 text-red-800 line-through'
                    : 'text-gray-800'
                }
              >
                {part.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 内容变更 */}
      {contentDiff.some(p => p.added || p.removed) && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">内容变更</div>
          {mode === 'unified' ? (
            <UnifiedDiff diff={contentDiff} />
          ) : (
            <SideBySideDiff diff={contentDiff} />
          )}
        </div>
      )}
    </div>
  )
}

function UnifiedDiff({ diff }: { diff: Change[] }) {
  let lineOld = 1
  let lineNew = 1

  return (
    <div className="font-mono text-xs overflow-x-auto">
      {diff.map((part, i) => {
        const lines = part.value.split('\n')
        // 去掉末尾空行（split 产生的）
        if (lines[lines.length - 1] === '') lines.pop()

        return lines.map((line, j) => {
          let oldLineNum: number | null = null
          let newLineNum: number | null = null

          if (part.added) {
            newLineNum = lineNew++
          } else if (part.removed) {
            oldLineNum = lineOld++
          } else {
            oldLineNum = lineOld++
            newLineNum = lineNew++
          }

          return (
            <div
              key={`${i}-${j}`}
              className={`flex ${
                part.added
                  ? 'bg-green-50'
                  : part.removed
                  ? 'bg-red-50'
                  : 'bg-white'
              }`}
            >
              <span className="w-10 text-right text-gray-400 px-2 py-0.5 border-r select-none flex-shrink-0">
                {oldLineNum ?? ''}
              </span>
              <span className="w-10 text-right text-gray-400 px-2 py-0.5 border-r select-none flex-shrink-0">
                {newLineNum ?? ''}
              </span>
              <span className={`w-4 text-center py-0.5 flex-shrink-0 ${
                part.added ? 'text-green-600' : part.removed ? 'text-red-600' : 'text-gray-300'
              }`}>
                {part.added ? '+' : part.removed ? '-' : ' '}
              </span>
              <span className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all ${
                part.added ? 'text-green-800' : part.removed ? 'text-red-800' : 'text-gray-700'
              }`}>
                {line || ' '}
              </span>
            </div>
          )
        })
      })}
    </div>
  )
}

function SideBySideDiff({ diff }: { diff: Change[] }) {
  // 构建左右两边的行
  const leftLines: Array<{ num: number; content: string; type: 'removed' | 'context' }> = []
  const rightLines: Array<{ num: number; content: string; type: 'added' | 'context' }> = []

  let leftNum = 1
  let rightNum = 1

  diff.forEach((part) => {
    const lines = part.value.split('\n')
    if (lines[lines.length - 1] === '') lines.pop()

    if (part.removed) {
      lines.forEach((line) => {
        leftLines.push({ num: leftNum++, content: line, type: 'removed' })
      })
    } else if (part.added) {
      lines.forEach((line) => {
        rightLines.push({ num: rightNum++, content: line, type: 'added' })
      })
    } else {
      // 补齐前面的不对称行
      while (leftLines.length < rightLines.length) {
        leftLines.push({ num: 0, content: '', type: 'context' })
      }
      while (rightLines.length < leftLines.length) {
        rightLines.push({ num: 0, content: '', type: 'context' })
      }
      lines.forEach((line) => {
        leftLines.push({ num: leftNum++, content: line, type: 'context' })
        rightLines.push({ num: rightNum++, content: line, type: 'context' })
      })
    }
  })

  // 补齐尾部
  while (leftLines.length < rightLines.length) {
    leftLines.push({ num: 0, content: '', type: 'context' })
  }
  while (rightLines.length < leftLines.length) {
    rightLines.push({ num: 0, content: '', type: 'context' })
  }

  return (
    <div className="font-mono text-xs overflow-x-auto flex">
      {/* 左侧 - 旧版 */}
      <div className="flex-1 border-r">
        {leftLines.map((line, i) => (
          <div
            key={i}
            className={`flex ${
              line.type === 'removed' ? 'bg-red-50' : line.num === 0 ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <span className="w-10 text-right text-gray-400 px-2 py-0.5 border-r select-none flex-shrink-0">
              {line.num || ''}
            </span>
            <span className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all ${
              line.type === 'removed' ? 'text-red-800' : 'text-gray-700'
            }`}>
              {line.content || ' '}
            </span>
          </div>
        ))}
      </div>
      {/* 右侧 - 新版 */}
      <div className="flex-1">
        {rightLines.map((line, i) => (
          <div
            key={i}
            className={`flex ${
              line.type === 'added' ? 'bg-green-50' : line.num === 0 ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <span className="w-10 text-right text-gray-400 px-2 py-0.5 border-r select-none flex-shrink-0">
              {line.num || ''}
            </span>
            <span className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all ${
              line.type === 'added' ? 'text-green-800' : 'text-gray-700'
            }`}>
              {line.content || ' '}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
