import { useState, useEffect } from 'react'
import { FiWifiOff, FiWifi, FiX } from 'react-icons/fi'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowBanner(true)
        // 3秒后自动隐藏恢复连接提示
        setTimeout(() => setShowBanner(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  if (!showBanner) return null

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-gray-800 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <FiWifi size={18} />
          <span className="text-sm font-medium">网络已恢复</span>
        </>
      ) : (
        <>
          <FiWifiOff size={18} />
          <span className="text-sm font-medium">当前处于离线状态，部分功能可能受限</span>
        </>
      )}
      <button
        onClick={() => setShowBanner(false)}
        className="p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <FiX size={14} />
      </button>
    </div>
  )
}
