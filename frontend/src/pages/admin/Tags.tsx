import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '@/api/admin'
import { ConfirmModal } from '@/components/ui'
import TagFormModal from '@/components/admin/TagFormModal'
import type { Tag } from '@/types'

export default function Tags() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)

  // Fetch tags
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: adminApi.getTags,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['popular-tags'] })
      setIsFormOpen(false)
      toast.success('标签创建成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建标签失败')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; color: string; isHot: boolean } }) =>
      adminApi.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['popular-tags'] })
      setIsFormOpen(false)
      setSelectedTag(null)
      toast.success('标签更新成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新标签失败')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['popular-tags'] })
      setIsDeleteOpen(false)
      setSelectedTag(null)
      toast.success('标签删除成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除标签失败')
    },
  })

  // Toggle hot mutation
  const toggleHotMutation = useMutation({
    mutationFn: adminApi.toggleTagHot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['popular-tags'] })
      toast.success('热门状态已更新！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新热门状态失败')
    },
  })

  const handleCreate = () => {
    setSelectedTag(null)
    setIsFormOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag)
    setIsFormOpen(true)
  }

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag)
    setIsDeleteOpen(true)
  }

  const handleToggleHot = (tag: Tag) => {
    toggleHotMutation.mutate(tag.id)
  }

  const handleFormSubmit = async (data: { name: string; color: string; isHot: boolean }) => {
    if (selectedTag) {
      await updateMutation.mutateAsync({ id: selectedTag.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleConfirmDelete = () => {
    if (selectedTag) {
      deleteMutation.mutate(selectedTag.id)
    }
  }

  const tags = data?.data || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">标签管理</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">管理文章标签</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm">
          <FiPlus size={16} />
          <span>新建标签</span>
        </button>
      </div>

      {/* 标签列表 */}
      <div className="card hover:transform-none">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="mt-4 text-sm text-ink-400">加载中...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <FiTag className="mx-auto text-ink-300 dark:text-ink-600" size={44} />
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">暂无标签</p>
            <button onClick={handleCreate} className="btn btn-primary btn-sm mt-4">
              创建第一个标签
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag: Tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-hairline-light dark:border-hairline-dark bg-paper-100/60 dark:bg-white/[0.03] hover:border-vermilion/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: tag.color || '#9E6B52' }}
                  >
                    #{tag.name}
                  </span>
                  {tag.isHot && (
                    <span className="text-amber-500" title="热门标签">
                      <FiStar size={14} fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-ink-400 mr-2">
                    {tag.count || 0} 篇
                  </span>
                  <button
                    onClick={() => handleToggleHot(tag)}
                    className={`p-2 rounded-xl transition-colors ${
                      tag.isHot
                        ? 'text-amber-500 bg-amber-500/10'
                        : 'text-ink-400 hover:text-amber-500 hover:bg-amber-500/10'
                    }`}
                    title={tag.isHot ? '取消热门' : '设为热门'}
                  >
                    <FiStar size={15} fill={tag.isHot ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 text-ink-400 hover:text-vermilion hover:bg-vermilion/10 rounded-xl transition-colors"
                    title="编辑"
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="p-2 text-ink-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="删除"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <TagFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedTag(null)
        }}
        onSubmit={handleFormSubmit}
        tag={selectedTag}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedTag(null)
        }}
        onConfirm={handleConfirmDelete}
        title="删除标签"
        message={`确定要删除 "${selectedTag?.name}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
