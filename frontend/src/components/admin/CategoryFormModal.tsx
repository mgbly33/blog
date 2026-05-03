import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import type { Category } from '@/types'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string }) => Promise<void>
  category?: Category | null
  isLoading?: boolean
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  isLoading = false,
}: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [category, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit({ name: name.trim(), description: description.trim() })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑分类' : '新建分类'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="分类名称"
            maxLength={50}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
            placeholder="可选描述"
            rows={3}
            maxLength={200}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                {isEditing ? '保存中...' : '创建中...'}
              </span>
            ) : (
              isEditing ? '保存' : '创建'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
