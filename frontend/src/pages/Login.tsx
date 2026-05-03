import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiEye, FiEyeOff, FiFeather } from 'react-icons/fi'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
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
      toast.success('登录成功')
      navigate(from, { replace: true })
    },
    onError: () => {
      toast.error('用户名或密码错误')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      toast.error('请填写用户名和密码')
      return
    }
    loginMutation.mutate(formData)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center fade-in">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="navbar-brand inline-flex justify-center">
            <FiFeather className="text-2xl" />
            <span className="text-2xl">现代博客</span>
          </Link>
          <p className="text-gray-500 mt-2">欢迎回来</p>
        </div>

        <div className="glass-clay p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            登录
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiUser size={18} />
                </span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input pl-11"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pl-11 pr-11"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn btn-primary w-full py-3"
            >
              {loginMutation.isPending ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400">或</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600">
            还没有账号？
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium ml-1 transition-colors">
              立即注册
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6">
          <Link to="/" className="text-gray-500 hover:text-primary-600 text-sm transition-colors">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  )
}
