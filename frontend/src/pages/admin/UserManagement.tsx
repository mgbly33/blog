import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiShield, FiSlash, FiTrash2, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi, UserListItem } from '@/api/admin'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmModal } from '@/components/ui'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: async () => {
      const response = await adminApi.getUsers(page, 20, search || undefined)
      return response.data
    },
    refetchInterval: 10000,
  })

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      adminApi.banUser(userId, banned),
    onSuccess: (_, { banned }) => {
      toast.success(banned ? '用户已封禁' : '用户已解封')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: () => toast.error('操作失败'),
  })

  const adminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      adminApi.toggleAdmin(userId, isAdmin),
    onSuccess: (_, { isAdmin }) => {
      toast.success(isAdmin ? '已授予管理员权限' : '已撤销管理员权限')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('操作失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('用户已删除')
      setDeletingUser(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: () => toast.error('删除失败'),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
          用户管理
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          管理全站注册用户、管理员角色与封禁状态。
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索用户名..."
            className="input pl-10 text-sm"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          搜索
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSearchInput('')
            }}
            className="btn btn-secondary btn-sm"
          >
            清除
          </button>
        )}
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden hover:transform-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-paper-200/60 dark:bg-white/[0.04] border-b border-hairline-light dark:border-hairline-dark">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">
                  用户
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">
                  状态
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-ink-500 dark:text-ink-300">
                  注册时间
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-ink-500 dark:text-ink-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-light dark:divide-hairline-dark">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-ink-400">
                    加载中...
                  </td>
                </tr>
              ) : !data?.content?.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-ink-400">
                    暂无匹配用户
                  </td>
                </tr>
              ) : (
                data.content.map((user) => {
                  const isSelf = String(user.id) === String(currentUser?.id)
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-paper-200/40 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar ||
                              `https://ui-avatars.com/api/?name=${user.username}&background=9E6B52&color=FAF8F4`
                            }
                            alt={user.username}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm text-ink-800 dark:text-ink-100">
                              {user.username}
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-vermilion">（当前账号）</span>
                              )}
                            </p>
                            {user.bio && (
                              <p className="text-xs text-ink-400 truncate max-w-xs">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.isAdmin && (
                            <span className="badge badge-vermilion">
                              <FiShield size={11} />
                              管理员
                            </span>
                          )}
                          {user.isBanned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300">
                              <FiSlash size={11} />
                              已封禁
                            </span>
                          )}
                          {!user.isAdmin && !user.isBanned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              <FiCheck size={11} />
                              正常
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-500 dark:text-ink-300">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              adminMutation.mutate({ userId: user.id, isAdmin: !user.isAdmin })
                            }
                            className={`p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.isAdmin
                                ? 'text-vermilion bg-vermilion/10'
                                : 'text-ink-400 hover:text-vermilion hover:bg-vermilion/10'
                            }`}
                            title={isSelf ? '不能修改自身管理员权限' : user.isAdmin ? '撤销管理员' : '设为管理员'}
                          >
                            <FiShield size={16} />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              banMutation.mutate({ userId: user.id, banned: !user.isBanned })
                            }
                            className={`p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.isBanned
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={isSelf ? '不能封禁当前登录账号' : user.isBanned ? '解除封禁' : '封禁用户'}
                          >
                            {user.isBanned ? <FiCheck size={16} /> : <FiSlash size={16} />}
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => setDeletingUser(user)}
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? '不能删除当前登录账号' : '删除用户'}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs">
            <p className="text-ink-500 dark:text-ink-400">
              共 {data.totalElements} 位用户，第 {page + 1} / {data.totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        title="删除用户"
        message={`确定要永久删除用户「${deletingUser?.username}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
