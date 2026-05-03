import { useState, FormEvent } from 'react'
import { FiEye, FiEyeOff, FiLock, FiCheck, FiX } from 'react-icons/fi'
import { userApi } from '@/api/user'
import toast from 'react-hot-toast'

interface PasswordFormProps {
  onSuccess?: () => void
}

export default function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strengthScore = getPasswordStrength(newPassword)
  const strengthLabels = ['非常弱', '弱', '一般', '强', '非常强']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']

  const passwordRequirements = [
    { met: newPassword.length >= 8, text: '至少8个字符' },
    { met: /[A-Z]/.test(newPassword), text: '包含大写字母' },
    { met: /[a-z]/.test(newPassword), text: '包含小写字母' },
    { met: /[0-9]/.test(newPassword), text: '包含数字' },
    { met: /[^A-Za-z0-9]/.test(newPassword), text: '包含特殊字符' },
  ]

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = '请输入当前密码'
    }

    if (!newPassword) {
      newErrors.newPassword = '请输入新密码'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = '密码至少需要8个字符'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认新密码'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      const response = await userApi.changePassword({
        currentPassword,
        newPassword
      })

      if (response.success) {
        toast.success('密码修改成功！')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setErrors({})
        onSuccess?.()
      } else {
        toast.error(response.message || '密码修改失败')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          当前密码
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="text-gray-400" />
          </div>
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input pl-10 pr-10"
            placeholder="请输入当前密码"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          新密码
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="text-gray-400" />
          </div>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input pl-10 pr-10"
            placeholder="请输入新密码"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
        )}

        {/* Strength Indicator */}
        {newPassword && (
          <div className="mt-3">
            <div className="flex gap-1 mb-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < strengthScore ? strengthColors[strengthScore - 1] : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className={`text-sm ${strengthScore >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
              密码强度：{strengthLabels[strengthScore - 1] || '太弱'}
            </p>
          </div>
        )}

        {/* Requirements Checklist */}
        {newPassword && (
          <div className="mt-3 space-y-1">
            {passwordRequirements.map((req, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                {req.met ? <FiCheck size={14} /> : <FiX size={14} />}
                {req.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          确认新密码
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="text-gray-400" />
          </div>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input pl-10 pr-10"
            placeholder="请再次输入新密码"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || strengthScore < 3}
        className="btn btn-primary w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            修改中...
          </span>
        ) : (
          '修改密码'
        )}
      </button>
    </form>
  )
}
