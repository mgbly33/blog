import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiBook, FiCheckCircle, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { seriesApi, type CreateSeriesRequest } from '@/api/series'
import { useAuthStore } from '@/stores/authStore'
import type { Series } from '@/types'

export default function SeriesList() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['series-list'],
    queryFn: () => seriesApi.getSeriesList(),
  })

  const refreshSeries = () => {
    queryClient.invalidateQueries({ queryKey: ['series-list'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSeriesRequest) => seriesApi.createSeries(payload),
    onSuccess: () => {
      refreshSeries()
      toast.success('专栏创建成功')
      resetForm()
    },
    onError: () => toast.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; description?: string; status?: 'Ongoing' | 'Completed' }) =>
      seriesApi.updateSeries(id, payload),
    onSuccess: () => {
      refreshSeries()
      toast.success('专栏已更新')
      resetForm()
    },
    onError: () => toast.error('更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seriesApi.deleteSeries(id),
    onSuccess: () => {
      refreshSeries()
      toast.success('专栏已删除')
    },
    onError: () => toast.error('删除失败'),
  })

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingSeries(null)
    setFormTitle('')
    setFormDescription('')
  }

  const ensureAdmin = () => {
    if (isAdminUser) return true
    toast.error('仅管理员可以管理专栏')
    return false
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!ensureAdmin()) return
    if (!formTitle.trim()) {
      toast.error('请输入专栏标题')
      return
    }
    if (editingSeries) {
      updateMutation.mutate({ id: editingSeries.id, title: formTitle.trim(), description: formDescription.trim() || undefined })
    } else {
      createMutation.mutate({ title: formTitle.trim(), description: formDescription.trim() || undefined })
    }
  }

  const handleEdit = (series: Series) => {
    if (!ensureAdmin()) return
    setEditingSeries(series)
    setFormTitle(series.title)
    setFormDescription(series.description || '')
    setShowCreateForm(true)
  }

  const handleDelete = (series: Series) => {
    if (!ensureAdmin()) return
    if (confirm(`确定要删除专栏「${series.title}」吗？关联文章不会被删除。`)) {
      deleteMutation.mutate(series.id)
    }
  }

  const handleToggleStatus = (series: Series) => {
    if (!ensureAdmin()) return
    const nextStatus = series.status === 'Ongoing' ? 'Completed' : 'Ongoing'
    updateMutation.mutate({ id: series.id, status: nextStatus })
  }

  const seriesList = data?.data?.content || []

  return (
    <div className="max-w-5xl mx-auto page-shell">
      <section className="panel-surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title">{isAdminUser ? '专栏管理' : '专栏目录'}</h1>
            <p className="section-subtitle">
              {isAdminUser ? '由管理员统一维护专栏，供作者发布文章时选择。' : '专栏由管理员统一创建，你可以在发布文章时选择归属专栏。'}
            </p>
          </div>
          {isAdminUser && (
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowCreateForm(true)
              }}
              className="btn btn-primary"
            >
              <FiPlus size={16} />
              新建专栏
            </button>
          )}
        </div>
      </section>

      {isAdminUser && showCreateForm && (
        <section className="panel-surface">
          <h3 className="font-bold text-gray-800 mb-4">{editingSeries ? '编辑专栏' : '新建专栏'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">专栏标题</label>
              <input
                type="text"
                className="input"
                maxLength={100}
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="请输入专栏标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">专栏描述</label>
              <textarea
                className="input min-h-[90px] resize-y"
                maxLength={500}
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                placeholder="请输入专栏描述"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSeries ? '保存修改' : '创建专栏'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                取消
              </button>
            </div>
          </form>
        </section>
      )}

      {isLoading ? (
        <section className="panel-surface text-center py-10 text-gray-500">加载中...</section>
      ) : seriesList.length === 0 ? (
        <section className="panel-surface text-center py-10">
          <FiBook size={42} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">当前暂无专栏</p>
          <p className="text-sm text-gray-400 mt-1">{isAdminUser ? '请先创建专栏，供用户投稿使用。' : '请联系管理员创建专栏。'}</p>
        </section>
      ) : (
        <section className="space-y-4">
          {seriesList.map((series) => (
            <article key={series.id} className="panel-surface">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/series/${series.id}`} className="truncate text-xl font-bold text-gray-800 hover:text-primary-600">
                      {series.title}
                    </Link>
                    <span
                      className={`status-chip ${
                        series.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {series.status === 'Completed' ? '已完结' : '连载中'}
                    </span>
                  </div>
                  {series.description && <p className="mt-2 text-sm text-gray-600">{series.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>{series.posts?.length || 0} 篇文章</span>
                    <span>更新于 {new Date(series.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>

                {isAdminUser && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(series)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      title={series.status === 'Ongoing' ? '标记为完结' : '标记为连载中'}
                    >
                      <FiCheckCircle size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(series)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                      title="编辑专栏"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(series)}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                      title="删除专栏"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
