import { FiCheck, FiCloud, FiCloudOff, FiLoader, FiAlertCircle } from 'react-icons/fi'
import type { SaveStatus } from '@/hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
}

export default function SaveStatusIndicator({
  status,
  lastSavedAt,
}: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saved':
        return {
          icon: <FiCheck size={14} />,
          text: lastSavedAt
            ? `已保存于 ${lastSavedAt.toLocaleTimeString()}`
            : '已保存',
          className: 'text-green-600 bg-green-50',
        }
      case 'saving':
        return {
          icon: <FiLoader size={14} className="animate-spin" />,
          text: '保存中...',
          className: 'text-blue-600 bg-blue-50',
        }
      case 'pending':
        return {
          icon: <FiCloud size={14} />,
          text: '待保存',
          className: 'text-yellow-600 bg-yellow-50',
        }
      case 'failed':
        return {
          icon: <FiAlertCircle size={14} />,
          text: '保存失败',
          className: 'text-red-600 bg-red-50',
        }
      case 'offline':
        return {
          icon: <FiCloudOff size={14} />,
          text: '离线模式',
          className: 'text-gray-600 bg-gray-100',
        }
      default:
        return {
          icon: <FiCloud size={14} />,
          text: '',
          className: 'text-gray-400',
        }
    }
  }

  const config = getStatusConfig()

  if (status === 'idle' && !lastSavedAt) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${config.className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}
