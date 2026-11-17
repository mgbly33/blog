import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { reportApi } from '@/api/report'
import Modal from '@/components/ui/Modal'

const REPORT_REASONS = [
  '垃圾广告',
  '色情低俗',
  '侵权抄袭',
  '人身攻击',
  '虚假信息',
  '敏感内容',
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
    mutationFn: () =>
      reportApi.createReport({
        targetType,
        targetId,
        reason,
        description: description || undefined,
      }),
    onSuccess: () => {
      toast.success('举报已提交，感谢你的反馈')
      onClose()
    },
    onError: () => toast.error('提交失败，请稍后重试'),
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
    <Modal isOpen onClose={onClose} title={`举报${targetLabel}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
            举报原因
          </label>
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors border ${
                  reason === r
                    ? 'bg-vermilion text-white border-vermilion font-medium'
                    : 'bg-paper-200/70 dark:bg-white/[0.06] text-ink-600 dark:text-ink-200 border-hairline-light dark:border-hairline-dark hover:border-vermilion/40'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1.5">
            详细说明（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请补充具体情况..."
            className="input min-h-[88px] resize-none text-sm"
            maxLength={512}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            取消
          </button>
          <button
            type="submit"
            disabled={reportMutation.isPending}
            className="btn btn-primary btn-sm"
          >
            {reportMutation.isPending ? '提交中...' : '提交举报'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
