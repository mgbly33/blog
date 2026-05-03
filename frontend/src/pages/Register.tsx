import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiEye, FiEyeOff, FiFeather, FiCheck } from 'react-icons/fi'
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
      toast.success('注册成功')
      navigate('/', { replace: true })
    },
    onError: () => {
      toast.error('注册失败，用户名可能已存在')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      toast.error('请填写用户名和密码')
      return
    }

    if (formData.username.length < 3) {
      toast.error('用户名至少3个字符')
      return
    }

    if (formData.password.length < 6) {
      toast.error('密码至少6个字符')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }

    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
    })
  }

  const passwordMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword

  return (
    <div className="min-h-[80vh] flex items-center justify-center fade-in">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="navbar-brand inline-flex justify-center">
            <FiFeather className="text-2xl" />
            <span className="text-2xl">现代博客</span>
          </Link>
          <p className="text-gray-500 mt-2">加入我们，开启创作之旅</p>
        </div>

        <div className="glass-clay p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            注册
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
                  placeholder="请输入用户名 (至少3个字符)"
                />
                {formData.username.length >= 3 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                    <FiCheck size={18} />
                  </span>
                )}
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
                  placeholder="请输入密码 (至少6个字符)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 flex gap-1">
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 2 ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 4 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="input pl-11 pr-11"
                  placeholder="请再次输入密码"
                />
                {passwordMatch && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                    <FiCheck size={18} />
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn btn-primary w-full py-3"
            >
              {registerMutation.isPending ? '注册中...' : '创建账号'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400">或</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600">
            已有账号？
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium ml-1 transition-colors">
              立即登录
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
