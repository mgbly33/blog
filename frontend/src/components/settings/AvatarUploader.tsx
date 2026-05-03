import { ChangeEvent, useRef, useState } from 'react'
import { FiCamera, FiUpload, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { uploadApi } from '@/api/upload'

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp'

interface AvatarUploaderProps {
  currentAvatar: string
  username: string
  onUpload: (url: string) => void
}

export default function AvatarUploader({ currentAvatar, username, onUpload }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview((event.target?.result as string) || null)
    }
    reader.readAsDataURL(file)

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setProgress(0)

    let progressInterval: ReturnType<typeof setInterval> | undefined
    try {
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const response = await uploadApi.uploadImage(file)
      setProgress(100)

      if (response.success && response.data) {
        onUpload(response.data)
      } else {
        throw new Error(response.message || '上传失败')
      }
    } catch (error) {
      const serverMessage =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message
      toast.error(serverMessage || '头像上传失败')
      setPreview(null)
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setUploading(false)
      setProgress(0)
    }
  }

  const handleClearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImage = preview || currentAvatar || `https://ui-avatars.com/api/?name=${username}&background=E8B4B8&color=fff&size=128`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <img
          src={displayImage}
          alt={username}
          className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
        />

        <div
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiCamera className="text-white" size={28} />
        </div>

        {uploading && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-gray-200"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="46"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary-500"
                strokeWidth="4"
                strokeDasharray={`${progress * 2.89} 289`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="46"
                cx="50"
                cy="50"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
          </div>
        )}

        {preview && !uploading && (
          <button
            onClick={handleClearPreview}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="btn btn-secondary btn-sm"
      >
        <FiUpload size={16} />
        <span>{uploading ? '上传中...' : '更换头像'}</span>
      </button>

      <p className="text-sm text-gray-500 text-center">
        支持JPG/PNG/GIF/WEBP格式，最大5MB
      </p>
    </div>
  )
}
