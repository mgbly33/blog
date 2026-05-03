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

  // Fetch categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminApi.getCategories,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsFormOpen(false)
      toast.success('分类创建成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建分类失败')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsFormOpen(false)
      setSelectedCategory(null)
      toast.success('分类更新成功！')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新分类失败')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsDeleteOpen(false)
      setSelectedCategory(null)
      toast.success('分类删除成功！')
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">分类管理</h1>
          <p className="text-gray-500">管理文章分类</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <FiPlus size={18} />
          <span>新建分类</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FiFolder className="mx-auto text-gray-300" size={48} />
            <p className="mt-4 text-gray-500">暂无分类</p>
            <button onClick={handleCreate} className="btn btn-primary mt-4">
              创建第一个分类
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">名称</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">描述</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">文章数</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category: Category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {category.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {category.blogCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedCategory(null)
        }}
        onConfirm={handleConfirmDelete}
        title="删除分类"
        message={`确定要删除 "${selectedCategory?.name}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
