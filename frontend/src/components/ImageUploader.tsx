import React, { useRef, useState } from 'react'
import { FiLoader, FiUploadCloud, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { uploadApi } from '@/api/upload'

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  className?: string
  height?: string
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  className = '',
  height = 'h-48',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const validateFile = (file: File): string | null => {
    const mime = (file.type || '').toLowerCase()
    const extAllowed = /\.(jpe?g|png|gif|webp)$/i.test(file.name || '')
    const mimeAllowed = ALLOWED_IMAGE_MIME_TYPES.includes(mime)

    if (!mimeAllowed && !extAllowed) {
      return '仅支持JPG/PNG/GIF/WEBP格式'
    }
    if (file.size > 5 * 1024 * 1024) {
      return '图片大小不能超过5MB'
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsUploading(true)
    try {
      const res = await uploadApi.uploadImage(file)
      if (res.success && res.data) {
        onChange(res.data)
        toast.success('上传成功')
      } else {
        toast.error(res.message || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      const serverMessage =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message
      toast.error(serverMessage || '上传失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerSelect = () => {
    fileInputRef.current?.click()
  }

  if (value) {
    return (
      <div className={`relative w-full ${height} rounded-lg overflow-hidden group border border-gray-200 ${className}`}>
        <img src={value} alt="已上传图片" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={triggerSelect}
            className="px-4 py-2 bg-white/90 text-sm font-medium rounded-md shadow-sm hover:bg-white text-gray-700 transition-colors"
          >
            更换图片
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-2 bg-red-500/90 text-white rounded-md hover:bg-red-600 transition-colors"
              title="移除图片"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_IMAGE_ACCEPT}
          onChange={handleFileSelect}
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerSelect}
      className={`
        relative w-full ${height} rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
        ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
        ${className}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_IMAGE_ACCEPT}
        onChange={handleFileSelect}
      />

      {isUploading ? (
        <div className="flex flex-col items-center text-primary-600">
          <FiLoader className="animate-spin mb-2" size={32} />
          <span className="text-sm font-medium">上传中...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-gray-500">
          <div className="p-3 bg-gray-100 rounded-full mb-3 group-hover:bg-gray-200 transition-colors">
            <FiUploadCloud size={24} />
          </div>
          <p className="text-sm font-medium">点击或拖拽图片以上传</p>
          <p className="text-xs mt-1 text-gray-400">支持JPG/PNG/GIF/WEBP格式，最大5MB</p>
        </div>
      )}
    </div>
  )
}
