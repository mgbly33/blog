import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { FiUser, FiLock, FiSave, FiArrowLeft } from 'react-icons/fi'
import { useAuthStore } from '@/stores/authStore'
import { userApi, UpdateProfileRequest } from '@/api/user'
import AvatarUploader from '@/components/settings/AvatarUploader'
import PasswordForm from '@/components/settings/PasswordForm'
import toast from 'react-hot-toast'

type SettingsTab = 'profile' | 'password'

export default function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [loading, setLoading] = useState(false)

  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [bio, setBio] = useState(user?.bio || '')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    setAvatar(user.avatar || '')
    setBio(user.bio || '')
  }, [user, navigate])

  if (!user) {
    return null
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const updateData: UpdateProfileRequest = { bio }
      if (avatar !== user.avatar) {
        updateData.avatar = avatar
      }
      const response = await userApi.updateProfile(updateData)
      if (response.success && response.data) {
        setUser(response.data)
        queryClient.invalidateQueries({ queryKey: ['user', response.data.username] })
        toast.success('个人资料已更新')
      } else {
        toast.error(response.message || '更新失败')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: '基本资料与头像', icon: FiUser },
    { id: 'password' as const, label: '登录密码与安全', icon: FiLock },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full border border-hairline-light dark:border-hairline-dark hover:border-vermilion transition-colors"
        >
          <FiArrowLeft size={16} />
        </button>
        <div>
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            ACCOUNT SETTINGS
          </p>
          <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
            账号资料与安全设置
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <nav className="md:col-span-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-ink-800 text-paper-50 dark:bg-ink-50 dark:text-ink-900 border-ink-800 dark:border-ink-50'
                  : 'bg-[#FAF8F4]/75 dark:bg-[#191817]/75 border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="md:col-span-8">
          <div className="card p-7 hover:transform-none">
            {activeTab === 'profile' && (
              <div className="space-y-7">
                <h2 className="font-editorial-serif text-2xl font-bold text-ink-900 dark:text-ink-50">
                  头像与个人简介
                </h2>

                <div className="flex flex-col items-center pb-7 border-b border-hairline-light dark:border-hairline-dark">
                  <AvatarUploader
                    currentAvatar={avatar}
                    username={user.username}
                    onUpload={async (url) => {
                      setAvatar(url)
                      try {
                        const response = await userApi.updateProfile({ avatar: url })
                        if (response.success && response.data) {
                          setUser(response.data)
                          queryClient.invalidateQueries({ queryKey: ['user', response.data.username] })
                          toast.success('头像已更新')
                        }
                      } catch {
                        toast.error('保存失败，请稍后重试')
                      }
                    }}
                  />
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1.5">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="input opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1.5">
                      个人简介
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={200}
                      className="input resize-y text-sm"
                      placeholder="介绍你的研究方向或写作领域（最多 200 字）..."
                    />
                    <p className="mt-1 text-[11px] font-editorial-mono text-ink-400 text-right">
                      {bio.length} / 200
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      <FiSave size={15} />
                      <span>{loading ? '正在保存...' : '保存资料修改'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-5">
                <h2 className="font-editorial-serif text-2xl font-bold text-ink-900 dark:text-ink-50">
                  修改登录密码
                </h2>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  定期更新密码有助于保障你的博客账号安全。
                </p>
                <PasswordForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
