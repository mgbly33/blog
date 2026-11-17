import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12">
      <div className="card max-w-lg w-full text-center p-10 space-y-5 hover:transform-none">
        <p className="text-[11px] font-editorial-mono uppercase tracking-[0.25em] text-vermilion font-semibold">
          PAGE NOT FOUND · 404
        </p>
        <h1 className="font-editorial-serif italic font-bold text-7xl sm:text-8xl text-ink-900 dark:text-ink-50 leading-none">
          404
        </h1>
        <h2 className="font-editorial-serif text-2xl font-bold text-ink-800 dark:text-ink-100">
          你访问的页面不存在或已被移除
        </h2>
        <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
          链接可能已变更或文章已归档，请返回现代博客首页或前往搜索页面查找。
        </p>
        <div className="pt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            <FiArrowLeft size={14} />
            <span>返回上一页</span>
          </button>
          <Link to="/" className="btn btn-primary">
            <FiHome size={14} />
            <span>回到博客首页</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
