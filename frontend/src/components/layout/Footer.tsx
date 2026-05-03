import { Link } from 'react-router-dom'
import { FiGithub, FiTwitter, FiMail, FiHeart, FiFeather, FiRss } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="footer-custom mt-auto py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="navbar-brand mb-4 inline-flex">
              <FiFeather className="text-xl" />
              <span>现代博客</span>
            </Link>
            <p className="text-gray-600 mt-4 leading-relaxed">
              一个现代化的博客平台，融合文艺复兴美学与现代设计。
              基于前后端分离架构构建，支持富文本编辑、草稿自动保存、评论互动等功能。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">快速链接</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-600 hover:text-primary-600 transition-colors">
                  发现
                </Link>
              </li>
              <li>
                <Link to="/editor" className="text-gray-600 hover:text-primary-600 transition-colors">
                  写文章
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">联系我们</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-100 hover:text-primary-600 transition-all"
              >
                <FiGithub size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-100 hover:text-primary-600 transition-all"
              >
                <FiTwitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-100 hover:text-primary-600 transition-all"
              >
                <FiMail size={20} />
              </a>
              <a
                href="/feed/rss"
                target="_blank"
                rel="noopener noreferrer"
                title="订阅更新"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-100 hover:text-orange-500 transition-all"
              >
                <FiRss size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center">
          <p className="text-gray-500 flex items-center justify-center gap-1">
            <span>&copy; {new Date().getFullYear()} 现代博客.</span>
            <span>由匠心驱动</span>
            <FiHeart className="text-primary-500" size={14} />
            <span>现代博客团队</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
