import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiAlertCircle, FiArrowRight, FiFeather, FiEdit3, FiBookOpen, FiMessageCircle } from 'react-icons/fi'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data
      login(user, accessToken, refreshToken)
      toast.success('登录成功，欢迎回来')
      navigate(from, { replace: true })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '用户名或密码错误'
      setErrorMessage(message)
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    if (!formData.username || !formData.password) {
      const msg = '请填写用户名和密码'
      setErrorMessage(msg)
      toast.error(msg)
      return
    }
    loginMutation.mutate(formData)
  }

  return (
    <div className="py-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-[28px] bg-[#FAF8F4]/85 dark:bg-[#191817]/85 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial-float overflow-hidden"
      >
        {/* Left: Warm Soft Blog Community Showcase */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 bg-gradient-to-br from-[#EFEAE1] via-[#E5ECE4] to-[#EAE5DC] dark:from-[#23201C] dark:via-[#1D231E] dark:to-[#1F1D1A] flex flex-col justify-between overflow-hidden">
          <motion.div
            animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#C89F81]/30 blur-2xl"
          />

          <div className="relative z-10 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-ink-800 dark:bg-ink-50 text-paper-50 dark:text-ink-900 flex items-center justify-center">
              <FiFeather size={16} />
            </span>
            <div>
              <span className="font-editorial-serif font-semibold text-xl text-ink-800 dark:text-ink-50">
                现代博客
              </span>
              <span className="block text-[10px] font-editorial-mono uppercase tracking-widest text-ink-400">
                MODERN BLOG
              </span>
            </div>
          </div>

          <div className="relative z-10 my-8 space-y-5">
            <h2 className="font-editorial-serif text-3xl font-medium leading-snug text-ink-800 dark:text-ink-50">
              记录技术沉淀、架构思考与日常随笔
            </h2>

            <div className="space-y-3 pt-1">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/[0.05] backdrop-blur-md border border-white/70 dark:border-white/10"
              >
                <FiEdit3 className="text-vermilion shrink-0" size={16} />
                <span className="text-xs text-ink-700 dark:text-ink-200">
                  Markdown 实时预览与自动保存草稿
                </span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/[0.05] backdrop-blur-md border border-white/70 dark:border-white/10"
              >
                <FiBookOpen className="text-vermilion shrink-0" size={16} />
                <span className="text-xs text-ink-700 dark:text-ink-200">
                  体系化专栏连载与沉浸式阅读体验
                </span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/[0.05] backdrop-blur-md border border-white/70 dark:border-white/10"
              >
                <FiMessageCircle className="text-vermilion shrink-0" size={16} />
                <span className="text-xs text-ink-700 dark:text-ink-200">
                  评论互动、文章收藏与站内私信交流
                </span>
              </motion.div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-ink-400">
            专注于纯粹、舒适的写作与阅读体验
          </p>
        </div>

        {/* Right: Clean Blog Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-7 space-y-1.5">
            <h1 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-ink-800 dark:text-ink-50">
              账号登录
            </h1>
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">
              登录你的博客账号，继续写作或参与社区互动
            </p>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-5 rounded-2xl text-xs text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/20"
            >
              <FiAlertCircle className="shrink-0 text-sm" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value })
                  if (errorMessage) setErrorMessage('')
                }}
                className="input"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errorMessage) setErrorMessage('')
                  }}
                  className="input pr-11"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800 dark:hover:text-white transition-colors"
                  aria-label="显示或隐藏密码"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn btn-primary w-full py-3 mt-2"
            >
              <span>{loginMutation.isPending ? '正在登录...' : '登录'}</span>
              <FiArrowRight size={15} />
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
            <span>还没有博客账号？</span>
            <Link
              to="/register"
              className="font-semibold text-vermilion hover:underline underline-offset-4"
            >
              立即免费注册 →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
