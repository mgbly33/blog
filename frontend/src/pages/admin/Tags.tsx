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
          <h1 className="text-2xl font-bold text-gray-800">标签管理</h1>
          <p className="text-gray-500">管理文章标签</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <FiPlus size={18} />
          <span>新建标签</span>
        </button>
      </div>

      {/* 标签列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <FiTag className="mx-auto text-gray-300" size={48} />
            <p className="mt-4 text-gray-500">暂无标签</p>
            <button onClick={handleCreate} className="btn btn-primary mt-4">
              创建第一个标签
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag: Tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1.5 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: tag.color || '#E8B4B8' }}
                  >
                    {tag.name}
                  </span>
                  {tag.isHot && (
                    <span className="text-amber-500" title="热门标签">
                      <FiStar size={16} fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-2">
                    {tag.count || 0} 篇
                  </span>
                  <button
                    onClick={() => handleToggleHot(tag)}
                    className={`p-2 rounded-lg transition-colors ${
                      tag.isHot
                        ? 'text-amber-500 hover:bg-amber-50'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                    title={tag.isHot ? '取消热门' : '设为热门'}
                  >
                    <FiStar size={16} fill={tag.isHot ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <FiTrash2 size={16} />
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
