import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminApi } from '@/api/admin'
import { ConfirmModal } from '@/components/ui'
import CategoryFormModal from '@/components/admin/CategoryFormModal'
import type { Category } from '@/types'

export default function Categories() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminApi.getCategories,
  })

  const refreshAllCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      refreshAllCategories()
      setIsFormOpen(false)
      toast.success('分类创建成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建分类失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      refreshAllCategories()
      setIsFormOpen(false)
      setSelectedCategory(null)
      toast.success('分类更新成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新分类失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      refreshAllCategories()
      setIsDeleteOpen(false)
      setSelectedCategory(null)
      toast.success('分类删除成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除分类失败')
    },
  })

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsFormOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: { name: string; description: string }) => {
    if (selectedCategory) {
      await updateMutation.mutateAsync({ id: selectedCategory.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id)
    }
  }

  const categories = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
            分类管理
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">管理博客文章分类目录</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm">
          <FiPlus size={16} />
          <span>新建分类</span>
        </button>
      </div>

      <div className="card p-0 overflow-hidden hover:transform-none">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-ink-400">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FiFolder className="mx-auto text-ink-300 dark:text-ink-600" size={44} />
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">暂无分类</p>
            <button onClick={handleCreate} className="btn btn-primary btn-sm mt-4">
              创建第一个分类
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-paper-200/60 dark:bg-white/[0.04] border-b border-hairline-light dark:border-hairline-dark">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">名称</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">描述</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">文章数</th>
                <th className="text-right px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-light dark:divide-hairline-dark">
              {categories.map((category: Category) => (
                <tr key={category.id} className="hover:bg-paper-200/40 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-sm text-ink-800 dark:text-ink-100">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-ink-500 dark:text-ink-400 text-xs">
                      {category.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge">{category.blogCount || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-ink-400 hover:text-vermilion hover:bg-vermilion/10 rounded-xl transition-colors"
                        title="编辑"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-ink-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="删除"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedCategory(null)
        }}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedCategory(null)
        }}
        onConfirm={handleConfirmDelete}
        title="删除分类"
        message={`确定要删除「${selectedCategory?.name}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
