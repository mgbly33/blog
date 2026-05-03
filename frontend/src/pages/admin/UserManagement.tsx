import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiShield, FiSlash, FiTrash2, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi, UserListItem } from '@/api/admin'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: async () => {
      const response = await adminApi.getUsers(page, 20, search || undefined)
      return response.data
    },
    refetchInterval: 10000, // Auto refresh every 10 seconds
  })

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      adminApi.banUser(userId, banned),
    onSuccess: (_, { banned }) => {
      toast.success(banned ? '用户已封禁' : '用户已解封')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('删除失败'),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleDelete = (user: UserListItem) => {
    if (confirm(`确定要删除用户 "${user.username}" 吗？此操作不可撤销！`)) {
      deleteMutation.mutate(user.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 mt-1">管理所有注册用户</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索用户名..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          搜索
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSearchInput('')
            }}
            className="btn btn-secondary"
          >
            清除
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注册时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : data?.content.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  暂无用户
                </td>
              </tr>
            ) : (
              data?.content.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{user.bio}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.isAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <FiShield size={12} />
                          管理员
                        </span>
                      )}
                      {user.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <FiSlash size={12} />
                          已封禁
                        </span>
                      )}
                      {!user.isAdmin && !user.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <FiCheck size={12} />
                          正常
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => adminMutation.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isAdmin
                            ? 'text-purple-600 hover:bg-purple-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={user.isAdmin ? '撤销管理员' : '设为管理员'}
                      >
                        <FiShield size={18} />
                      </button>
                      <button
                        onClick={() => banMutation.mutate({ userId: user.id, banned: !user.isBanned })}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isBanned
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title={user.isBanned ? '解除封禁' : '封禁用户'}
                      >
                        {user.isBanned ? <FiCheck size={18} /> : <FiSlash size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="删除用户"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {data.totalElements} 条记录，第 {page + 1} / {data.totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={data.first}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={data.last}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
