import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiArrowRight, FiFeather, FiCheck } from 'react-icons/fi'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data
      login(user, accessToken, refreshToken)
      toast.success('注册成功，欢迎加入')
      navigate('/', { replace: true })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || '注册失败，用户名可能已存在'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      toast.error('请填写完整的用户名与密码')
      return
    }
    if (formData.username.length < 3) {
      toast.error('用户名至少需要 3 个字符')
      return
    }
    if (formData.password.length < 6) {
      toast.error('密码至少需要 6 个字符')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
    })
  }

  return (
    <div className="py-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-[28px] bg-[#FAF8F4]/85 dark:bg-[#191817]/85 backdrop-blur-2xl border border-hairline-light dark:border-hairline-dark shadow-editorial-float overflow-hidden"
      >
        <div className="lg:col-span-5 relative p-8 sm:p-10 bg-gradient-to-br from-[#E6ECE4] via-[#EFEAE1] to-[#E6EBF0] dark:from-[#1E241F] dark:via-[#23201C] dark:to-[#1C2228] flex flex-col justify-between overflow-hidden">
          <div className="relative z-10 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-ink-800 dark:bg-ink-50 text-paper-50 dark:text-ink-900 flex items-center justify-center">
              <FiFeather size={16} />
            </span>
            <span className="font-editorial-serif font-semibold text-xl text-ink-800 dark:text-ink-50">
              现代博客
            </span>
          </div>

          <div className="relative z-10 my-8 space-y-4">
            <h2 className="font-editorial-serif text-3xl font-medium leading-snug text-ink-800 dark:text-ink-50">
              创建你的个人博客主页
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-600 dark:text-ink-200">
              <li className="flex items-center gap-2.5">
                <FiCheck className="text-vermilion shrink-0" />
                <span>发布 Markdown 文章与代码笔记</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiCheck className="text-vermilion shrink-0" />
                <span>草稿历史版本比对与一键回滚</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiCheck className="text-vermilion shrink-0" />
                <span>关注喜爱的作者、收藏文章与评论互动</span>
              </li>
            </ul>
          </div>

          <p className="relative z-10 text-xs text-ink-400">
            开启你的第一篇创作
          </p>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6 space-y-1.5">
            <h1 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-ink-800 dark:text-ink-50">
              注册新账号
            </h1>
            <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400">
              填写以下信息，快速创建你的个人博客账户
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                用户名（至少 3 个字符）
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                密码（至少 6 个字符）
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pr-11"
                  placeholder="请输入密码"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800 dark:hover:text-white"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                确认密码
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input"
                placeholder="请再次输入密码"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn btn-primary w-full py-3 mt-2"
            >
              <span>{registerMutation.isPending ? '注册中...' : '立即注册'}</span>
              <FiArrowRight size={15} />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
            <span>已经有账号？</span>
            <Link
              to="/login"
              className="font-semibold text-vermilion hover:underline underline-offset-4"
            >
              直接去登录 →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
