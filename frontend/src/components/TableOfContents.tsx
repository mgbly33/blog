import { FiList } from 'react-icons/fi'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  toc: TocItem[]
  activeId: string
  onClickHeading: (id: string) => void
}

/**
 * 文章目录侧边栏组件
 */
export default function TableOfContents({ toc, activeId, onClickHeading }: TableOfContentsProps) {
  if (toc.length === 0) return null

  // 找到最小的标题级别作为基准
  const minLevel = Math.min(...toc.map(item => item.level))

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
          <FiList size={14} />
          目录
        </h3>
        <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => onClickHeading(item.id)}
              className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors truncate ${
                activeId === item.id
                  ? 'text-primary-600 bg-primary-50 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{ paddingLeft: `${(item.level - minLevel) * 12 + 8}px` }}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
