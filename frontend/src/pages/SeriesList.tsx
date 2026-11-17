import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiBookOpen, FiCheckCircle, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { seriesApi, type CreateSeriesRequest } from '@/api/series'
import { useAuthStore } from '@/stores/authStore'
import ImageUploader from '@/components/ImageUploader'
import StateCard from '@/components/ui/StateCard'
import { ConfirmModal } from '@/components/ui'
import type { Series } from '@/types'

export default function SeriesList() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [deletingSeries, setDeletingSeries] = useState<Series | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCoverUrl, setFormCoverUrl] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['series-list'],
    queryFn: () => seriesApi.getSeriesList(),
  })

  const refreshSeries = () => {
    queryClient.invalidateQueries({ queryKey: ['series-list'] })
    queryClient.invalidateQueries({ queryKey: ['home-series'] })
    queryClient.invalidateQueries({ queryKey: ['series'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSeriesRequest) => seriesApi.createSeries(payload),
    onSuccess: () => {
      refreshSeries()
      toast.success('系列专栏已创建')
      resetForm()
    },
    onError: () => toast.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      description?: string
      coverUrl?: string
      status?: 'Ongoing' | 'Completed'
    }) => seriesApi.updateSeries(id, payload),
    onSuccess: () => {
      refreshSeries()
      toast.success('专栏信息已更新')
      resetForm()
    },
    onError: () => toast.error('更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seriesApi.deleteSeries(id),
    onSuccess: () => {
      refreshSeries()
      setDeletingSeries(null)
      toast.success('专栏已删除')
    },
    onError: () => toast.error('删除失败'),
  })

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingSeries(null)
    setFormTitle('')
    setFormDescription('')
    setFormCoverUrl('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdminUser) return
    if (!formTitle.trim()) {
      toast.error('请输入专栏名称')
      return
    }
    if (editingSeries) {
      updateMutation.mutate({
        id: editingSeries.id,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        coverUrl: formCoverUrl || undefined,
      })
    } else {
      createMutation.mutate({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        coverUrl: formCoverUrl || undefined,
      })
    }
  }

  const handleEdit = (series: Series) => {
    setEditingSeries(series)
    setFormTitle(series.title)
    setFormDescription(series.description || '')
    setFormCoverUrl(series.coverUrl || '')
    setShowCreateForm(true)
  }

  const handleToggleStatus = (series: Series) => {
    const nextStatus = series.status === 'Ongoing' ? 'Completed' : 'Ongoing'
    updateMutation.mutate({ id: series.id, status: nextStatus })
  }

  const seriesList = (data?.data?.content || []).filter((s) => Boolean(s.title?.trim()))

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-8">
      <header className="border-b border-hairline-light dark:border-hairline-dark pb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            SERIES & COLUMNS
          </p>
          <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold text-ink-900 dark:text-ink-50">
            系列专栏合集
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xl">
            围绕特定技术专题或思考脉络整理的系列文章连载，按章节顺序循序渐进阅读。
          </p>
        </div>

        {isAdminUser && (
          <button
            type="button"
            onClick={() => {
              if (showCreateForm) resetForm()
              else setShowCreateForm(true)
            }}
            className="btn btn-primary"
          >
            <FiPlus size={15} />
            <span>{showCreateForm ? '收起表单' : '新建专栏'}</span>
          </button>
        )}
      </header>

      {isAdminUser && showCreateForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 hover:transform-none">
          <h2 className="font-editorial-serif text-xl font-bold text-ink-900 dark:text-ink-50">
            {editingSeries ? '编辑系列专栏' : '新建系列专栏'}
          </h2>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5">专栏名称</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="input"
              placeholder="例如：现代前端工程化实战"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5">专栏简介</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="input min-h-[88px]"
              placeholder="概述该系列专栏的核心内容..."
            />
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5">专栏封面（可选）</label>
            <ImageUploader
              value={formCoverUrl}
              onChange={setFormCoverUrl}
              onRemove={() => setFormCoverUrl('')}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm">
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {editingSeries ? '保存修改' : '创建专栏'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <StateCard type="loading" title="正在加载系列专栏..." />
      ) : seriesList.length === 0 ? (
        <StateCard type="empty" title="暂无系列专栏" description="创建系列专栏后将展示在这里。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {seriesList.map((series, idx) => {
            const chapterCount = series.posts?.length || 0
            return (
              <div
                key={series.id}
                className="group relative card p-7 flex flex-col justify-between transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span className="text-vermilion font-semibold flex items-center gap-1.5">
                      <FiBookOpen size={13} />
                      <span>专栏 #{String(idx + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {series.status === 'Completed' && (
                        <FiCheckCircle size={12} className="text-vermilion" />
                      )}
                      {series.status === 'Completed' ? '已完结' : '连载中'} · {chapterCount} 篇文章
                    </span>
                  </div>

                  <Link to={`/series/${series.id}`} className="block space-y-2">
                    <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 group-hover:text-vermilion transition-colors">
                      {series.title}
                    </h2>
                    {series.description && (
                      <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </Link>
                </div>

                <div className="pt-5 mt-6 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between text-xs">
                  <span className="text-ink-400">
                    作者：{series.author?.username || '管理员'}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAdminUser && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(series)}
                          className="px-2.5 py-1 rounded-full border border-hairline-light dark:border-hairline-dark text-ink-500 hover:text-vermilion hover:border-vermilion transition-colors"
                        >
                          {series.status === 'Ongoing' ? '标记完结' : '恢复连载'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(series)}
                          className="p-1.5 text-ink-400 hover:text-ink-800 dark:hover:text-ink-100"
                          title="编辑专栏"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSeries(series)}
                          className="p-1.5 text-ink-400 hover:text-rose-600"
                          title="删除专栏"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                    <Link
                      to={`/series/${series.id}`}
                      className="inline-flex items-center gap-1 font-medium text-ink-800 dark:text-ink-100 group-hover:text-vermilion"
                    >
                      <span>进入专栏</span>
                      <FiArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingSeries)}
        onClose={() => setDeletingSeries(null)}
        onConfirm={() => deletingSeries && deleteMutation.mutate(deletingSeries.id)}
        title="删除系列专栏"
        message={`确定要删除专栏「${deletingSeries?.title}」吗？专栏内的文章不会被删除。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
