import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiClock, FiRefreshCw, FiX, FiEye, FiColumns, FiList } from 'react-icons/fi'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { draftApi, DraftVersion } from '@/api/draft'
import VersionDiff from './VersionDiff'

type ViewMode = 'preview' | 'source' | 'diff-unified' | 'diff-side'

interface VersionHistoryProps {
  draftId: string
  currentTitle?: string
  currentContent?: string
  isOpen: boolean
  onClose: () => void
  onRestore: (content: string, title: string) => void
}

export default function VersionHistory({
  draftId,
  currentTitle = '',
  currentContent = '',
  isOpen,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const queryClient = useQueryClient()
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(null)
  const [compareVersion, setCompareVersion] = useState<DraftVersion | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [compareMode, setCompareMode] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['draftVersions', draftId],
    queryFn: () => draftApi.getVersionHistory(draftId),
    enabled: isOpen && !!draftId,
  })

  const restoreMutation = useMutation({
    mutationFn: (version: number) => draftApi.restoreVersion(draftId, version),
    onSuccess: (response) => {
      const draft = response.data
      onRestore(draft.content, draft.title)
      queryClient.invalidateQueries({ queryKey: ['draftVersions', draftId] })
      toast.success('版本已恢复')
      onClose()
    },
    onError: () => {
      toast.error('恢复失败，请重试')
    },
  })

  const versions = data?.data || []

  const handleVersionClick = (version: DraftVersion) => {
    if (compareMode) {
      // 对比模式：第一次选择为基准版本，第二次选择为对比版本
      if (!selectedVersion) {
        setSelectedVersion(version)
      } else if (selectedVersion.id === version.id) {
        // 取消选择
        setSelectedVersion(null)
        setCompareVersion(null)
      } else {
        setCompareVersion(version)
        setViewMode('diff-unified')
      }
    } else {
      setSelectedVersion(version)
      setCompareVersion(null)
      setViewMode('preview')
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setSelectedVersion(null)
    setCompareVersion(null)
    setViewMode('preview')
  }

  // 对比当前编辑器内容与选中版本
  const handleCompareWithCurrent = (version: DraftVersion) => {
    setSelectedVersion(version)
    setCompareVersion({
      ...version,
      id: 'current',
      version: 0,
      title: currentTitle,
      content: currentContent,
      wordCount: currentContent.length,
      createdAt: new Date().toISOString(),
    })
    setViewMode('diff-unified')
  }

  if (!isOpen) return null

  // 确定 diff 的左右两侧（旧→新，按版本号排列）
  let diffOld: DraftVersion | null = null
  let diffNew: DraftVersion | null = null
  if (selectedVersion && compareVersion) {
    if (compareVersion.id === 'current') {
      // 与当前内容对比
      diffOld = selectedVersion
      diffNew = compareVersion
    } else if (selectedVersion.version < compareVersion.version) {
      diffOld = selectedVersion
      diffNew = compareVersion
    } else {
      diffOld = compareVersion
      diffNew = selectedVersion
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Offcanvas Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <FiClock size={20} className="text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">版本历史</h2>
            <button
              onClick={toggleCompareMode}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                compareMode
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiColumns size={14} className="inline mr-1" />
              {compareMode ? '退出对比' : '版本对比'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Compare mode hint */}
        {compareMode && (
          <div className="px-6 py-2 bg-blue-50 text-sm text-blue-600 border-b">
            {!selectedVersion
              ? '请选择第一个版本作为基准'
              : !compareVersion
              ? '请选择第二个版本进行对比（或点击"与当前对比"按钮）'
              : `正在对比 版本 ${diffOld?.version ?? '当前'} → 版本 ${diffNew?.version === 0 ? '当前' : diffNew?.version}`}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Version List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                暂无历史版本
              </div>
            ) : (
              <div className="divide-y">
                {versions.map((version: DraftVersion) => {
                  const isSelected = selectedVersion?.id === version.id
                  const isCompare = compareVersion?.id === version.id
                  return (
                    <div key={version.id}>
                      <button
                        onClick={() => handleVersionClick(version)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-primary-50 border-l-2 border-primary-500' :
                          isCompare ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm">
                            版本 {version.version}
                          </span>
                          {isSelected && compareMode && (
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded">基准</span>
                          )}
                          {isCompare && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">对比</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(version.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {version.title || '无标题'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {version.wordCount} 字
                        </div>
                      </button>
                      {/* 与当前内容对比按钮 */}
                      {compareMode && isSelected && !compareVersion && (
                        <div className="px-4 pb-2">
                          <button
                            onClick={() => handleCompareWithCurrent(version)}
                            className="text-xs text-primary-500 hover:text-primary-600 hover:underline"
                          >
                            与当前编辑器内容对比
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview / Diff Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Diff View */}
            {(viewMode === 'diff-unified' || viewMode === 'diff-side') && diffOld && diffNew ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">版本对比</h3>
                    <p className="text-sm text-gray-500">
                      版本 {diffOld.version} → {diffNew.version === 0 ? '当前' : `版本 ${diffNew.version}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('diff-unified')}
                      className={`btn text-sm ${viewMode === 'diff-unified' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <FiList size={14} />
                      <span>统一视图</span>
                    </button>
                    <button
                      onClick={() => setViewMode('diff-side')}
                      className={`btn text-sm ${viewMode === 'diff-side' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <FiColumns size={14} />
                      <span>并排视图</span>
                    </button>
                  </div>
                </div>
                <VersionDiff
                  oldTitle={diffOld.title}
                  newTitle={diffNew.title}
                  oldContent={diffOld.content}
                  newContent={diffNew.content}
                  oldVersion={diffOld.version}
                  newVersion={diffNew.version === 0 ? -1 : diffNew.version}
                  mode={viewMode === 'diff-side' ? 'side-by-side' : 'unified'}
                />
              </div>
            ) : selectedVersion && !compareMode ? (
              /* Single Version Preview */
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      版本 {selectedVersion.version}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedVersion.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode(viewMode === 'preview' ? 'source' : 'preview')}
                      className="btn btn-secondary text-sm"
                    >
                      <FiEye size={14} />
                      <span>{viewMode === 'source' ? '预览' : '源码'}</span>
                    </button>
                    <button
                      onClick={() => handleCompareWithCurrent(selectedVersion)}
                      className="btn btn-secondary text-sm"
                    >
                      <FiColumns size={14} />
                      <span>与当前对比</span>
                    </button>
                    <button
                      onClick={() => restoreMutation.mutate(selectedVersion.version)}
                      disabled={restoreMutation.isPending}
                      className="btn btn-primary text-sm"
                    >
                      <FiRefreshCw size={14} />
                      <span>{restoreMutation.isPending ? '恢复中...' : '恢复此版本'}</span>
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <span className="text-xs text-gray-500">标题</span>
                    <p className="font-medium text-gray-800">
                      {selectedVersion.title || '无标题'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">内容</span>
                    {viewMode === 'preview' ? (
                      <div className="prose prose-sm max-w-none mt-2">
                        <ReactMarkdown>{selectedVersion.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="mt-2 p-4 bg-white border rounded text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {selectedVersion.content}
                      </pre>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    字数: {selectedVersion.wordCount}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiClock size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>{compareMode ? '选择两个版本进行对比' : '选择左侧版本查看详情'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
