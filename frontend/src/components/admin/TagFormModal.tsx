import { useState, useEffect } from 'react'
import { Modal, ColorPicker } from '@/components/ui'
import type { Tag } from '@/types'

interface TagFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; color: string; isHot: boolean }) => Promise<void>
  tag?: Tag | null
  isLoading?: boolean
}

export default function TagFormModal({
  isOpen,
  onClose,
  onSubmit,
  tag,
  isLoading = false,
}: TagFormModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#E8B4B8')
  const [isHot, setIsHot] = useState(false)

  const isEditing = !!tag

  useEffect(() => {
    if (tag) {
      setName(tag.name)
      setColor(tag.color || '#E8B4B8')
      setIsHot(tag.isHot || false)
    } else {
      setName('')
      setColor('#E8B4B8')
      setIsHot(false)
    }
  }, [tag, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit({ name: name.trim(), color, isHot })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑标签' : '新建标签'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="标签名称"
            maxLength={30}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            颜色
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">设为热门标签</span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-8">
            热门标签将会突出显示
          </p>
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
