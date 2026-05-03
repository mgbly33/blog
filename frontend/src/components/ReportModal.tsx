import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { reportApi } from '@/api/report'

const REPORT_REASONS = [
  '垃圾广告',
  '色情低俗',
  '侵权抄袭',
  '人身攻击',
  '虚假信息',
  '政治敏感',
  '其他',
]

interface ReportModalProps {
  targetType: 'BLOG' | 'COMMENT' | 'USER'
  targetId: string
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  const targetLabel = targetType === 'BLOG' ? '文章' : targetType === 'COMMENT' ? '评论' : '用户'

  const reportMutation = useMutation({
    mutationFn: () => reportApi.createReport({
      targetType,
      targetId,
      reason,
      description: description || undefined,
    }),
    onSuccess: () => {
      toast.success('举报已提交，感谢你的反馈')
      onClose()
    },
    onError: () => toast.error('提交失败'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      toast.error('请选择举报原因')
      return
    }
    reportMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FiAlertTriangle size={18} className="text-yellow-500" />
            举报{targetLabel}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">举报原因</label>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    reason === r
                      ? 'bg-red-100 text-red-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述具体情况..."
              className="input min-h-[80px] resize-none text-sm"
              maxLength={512}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={reportMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {reportMutation.isPending ? '提交中...' : '提交举报'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
