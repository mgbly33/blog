import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          页面不存在
        </h2>
        <p className="text-gray-600 mb-8">
          抱歉，您访问的页面不存在或已被删除
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            <FiArrowLeft size={16} />
            <span>返回上页</span>
          </button>
          <Link to="/" className="btn btn-primary">
            <FiHome size={16} />
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
