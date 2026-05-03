import Modal from './Modal'
import { IoWarning, IoInformationCircle, IoAlertCircle } from 'react-icons/io5'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isLoading?: boolean
}

const variantConfig = {
  danger: {
    icon: IoAlertCircle,
    iconColor: 'text-red-500',
    buttonClass: 'btn btn-danger',
  },
  warning: {
    icon: IoWarning,
    iconColor: 'text-amber-500',
    buttonClass: 'btn btn-warning',
  },
  info: {
    icon: IoInformationCircle,
    iconColor: 'text-blue-500',
    buttonClass: 'btn btn-primary',
  },
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <div className="confirm-modal-content">
        <div className={`confirm-modal-icon ${config.iconColor}`}>
          <Icon size={48} />
        </div>
        <h4 className="confirm-modal-title">{title}</h4>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={config.buttonClass}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                处理中...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
