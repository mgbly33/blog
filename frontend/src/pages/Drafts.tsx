import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiClock, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { draftApi } from '@/api/draft'
import StateCard from '@/components/ui/StateCard'
import type { DraftListItem } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

function parseDraftList(data: unknown): DraftListItem[] {
  if (Array.isArray(data)) {
    return data as DraftListItem[]
  }

  if (data && typeof data === 'object' && 'content' in data) {
    const content = (data as { content?: unknown }).content
    if (Array.isArray(content)) {
      return content as DraftListItem[]
    }
  }

  return []
}

export default function Drafts() {
  const queryClient = useQueryClient()

  const { data: draftsData, isLoading, isError } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => draftApi.getDrafts(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => draftApi.deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
      toast.success('草稿已删除')
    },
    onError: () => {
      toast.error('删除失败，请稍后重试')
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这篇草稿吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const drafts = parseDraftList(draftsData?.data)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">我的草稿</h1>
        <Link to="/editor" className="btn btn-primary">
          写新文章
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <StateCard type="error" title="加载草稿失败" description="请刷新后重试" />
      ) : drafts.length === 0 ? (
        <StateCard type="empty" title="暂无草稿" actionText="开始写作" actionTo="/editor" />
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onDelete={() => handleDelete(draft.id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DraftCard({
  draft,
  onDelete,
  isDeleting,
}: {
  draft: DraftListItem
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <article className="card transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 truncate text-lg font-bold text-gray-800">
            {draft.title || '无标题草稿'}
          </h2>

          {draft.summary && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-600">
              {draft.summary}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <FiClock size={14} />
              {draft.updatedAt
                ? `${dayjs(draft.updatedAt).fromNow()}更新`
                : '刚刚更新'}
            </span>
            <span>{draft.wordCount ?? 0} 字</span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            to={`/editor?draft=${draft.id}`}
            className="btn btn-secondary btn-sm"
          >
            <FiEdit2 size={14} />
            <span>继续编辑</span>
          </Link>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="btn btn-danger btn-sm"
            aria-label="删除草稿"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
