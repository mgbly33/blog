import { Link } from 'react-router-dom'
import { FiArrowUp, FiRss } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="relative z-10 w-full max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-10">
      <div className="border-t border-hairline-light dark:border-hairline-dark pt-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div className="space-y-2">
          <p className="font-editorial-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
            MODERN BLOG PLATFORM
          </p>
          <h3 className="font-editorial-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink-800 dark:text-ink-50">
            现代博客 · 记录思考与技术沉淀
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-ink-500 dark:text-ink-400">
          <Link to="/search" className="editorial-link hover:text-ink-900 dark:hover:text-ink-50">
            文章检索
          </Link>
          <Link to="/series" className="editorial-link hover:text-ink-900 dark:hover:text-ink-50">
            系列专栏
          </Link>
          <Link to="/editor" className="editorial-link hover:text-ink-900 dark:hover:text-ink-50">
            写文章
          </Link>
          <a
            href="/feed/rss"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 editorial-link hover:text-ink-900 dark:hover:text-ink-50"
          >
            <FiRss size={12} className="text-vermilion" />
            <span>RSS 订阅</span>
          </a>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-hairline-light dark:border-hairline-dark hover:border-ink-600 text-ink-700 dark:text-ink-200 transition-colors"
          >
            <span>回到顶部</span>
            <FiArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  )
}
