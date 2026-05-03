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
    if (user) {
      setAvatar(user.avatar || '')
      setBio(user.bio || '')
    }
  }, [user])

  if (!user) {
    navigate('/login')
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
        toast.error(response.message || '更新个人资料失败')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新个人资料失败')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: '个人资料', icon: FiUser },
    { id: 'password' as const, label: '修改密码', icon: FiLock },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-warm)] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">设置</h1>
            <p className="text-gray-500">管理你的账号信息与安全设置</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <nav className="md:w-64 flex-shrink-0">
            <div className="card p-2 md:sticky md:top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1">
            <div className="card">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-6">个人资料设置</h2>

                    <div className="flex flex-col items-center pb-8 border-b border-gray-100">
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
                              toast.success('头像更新成功')
                            }
                          } catch {
                            toast.error('头像保存失败，请稍后重试')
                          }
                        }}
                      />
                    </div>

                    <div className="pt-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          用户名
                        </label>
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="input bg-gray-50 cursor-not-allowed"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          用户名暂不支持修改
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          个人简介
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          maxLength={500}
                          className="input resize-none"
                          placeholder="介绍一下你自己..."
                        />
                        <p className="mt-1 text-sm text-gray-500 text-right">
                          {bio.length}/500 字
                        </p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="btn btn-primary"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                              保存中...
                            </span>
                          ) : (
                            <>
                              <FiSave size={18} />
                              <span>保存修改</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">修改密码</h2>
                  <p className="text-gray-500 mb-6">
                    为了账号安全，建议定期更新密码并使用强密码组合。
                  </p>
                  <PasswordForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
