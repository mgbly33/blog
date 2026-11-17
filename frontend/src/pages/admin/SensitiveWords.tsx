import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiRefreshCw, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { sensitiveWordApi, SensitiveWordItem } from '@/api/sensitiveWord'

const levelLabels: Record<string, { label: string; color: string }> = {
  BLOCK: { label: '禁止', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  REVIEW: { label: '审核', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  WARN: { label: '警告', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
}

export default function SensitiveWords() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [checkText, setCheckText] = useState('')

  const [newWord, setNewWord] = useState('')
  const [newLevel, setNewLevel] = useState<string>('BLOCK')
  const [newCategory, setNewCategory] = useState('')
  const [batchWords, setBatchWords] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sensitive-words', page],
    queryFn: () => sensitiveWordApi.getWords(page, 20),
  })

  const addMutation = useMutation({
    mutationFn: () =>
      sensitiveWordApi.addWord({
        word: newWord,
        level: newLevel,
        category: newCategory || undefined,
      }),
    onSuccess: () => {
      toast.success('敏感词添加成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
      setNewWord('')
      setNewCategory('')
      setShowAdd(false)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || '添加失败'),
  })

  const batchMutation = useMutation({
    mutationFn: () => {
      const words = batchWords
        .split('\n')
        .map((w) => w.trim())
        .filter(Boolean)
      return sensitiveWordApi.batchAddWords({
        words,
        level: newLevel,
        category: newCategory || undefined,
      })
    },
    onSuccess: (res) => {
      toast.success(res.message || '批量添加成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
      setBatchWords('')
      setShowBatch(false)
    },
    onError: () => toast.error('批量添加失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      word?: string
      level?: string
      category?: string
    }) => sensitiveWordApi.updateWord(id, payload),
    onSuccess: () => {
      toast.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
      setEditingId(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || '更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sensitiveWordApi.deleteWord(id),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
    },
    onError: () => toast.error('删除失败'),
  })

  const checkMutation = useMutation({
    mutationFn: () => sensitiveWordApi.checkText(checkText),
    onSuccess: (res) => {
      const result = res.data
      if (result.passed) {
        toast.success('检测通过，未发现敏感词')
      } else {
        const matched = result.matches.map((m) => m.word).join(', ')
        toast.error(`命中 ${result.matchCount} 个敏感词: ${matched}`)
      }
    },
    onError: () => toast.error('检测请求失败'),
  })

  const reloadMutation = useMutation({
    mutationFn: () => sensitiveWordApi.reloadFilter(),
    onSuccess: (res) => {
      toast.success(`过滤器已重载（共 ${res.data?.wordCount || 0} 个词）`)
    },
  })

  const words: SensitiveWordItem[] = data?.data?.content || []
  const pageData = data?.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
            敏感词管理
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">管理社区内容安全过滤词库</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reloadMutation.mutate()}
            disabled={reloadMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <FiRefreshCw size={14} className={reloadMutation.isPending ? 'animate-spin' : ''} />
            <span>重载词库</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBatch(!showBatch)}
            className="btn btn-secondary btn-sm"
          >
            <FiUpload size={14} />
            <span>批量添加</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="btn btn-primary btn-sm"
          >
            <FiPlus size={14} />
            <span>添加敏感词</span>
          </button>
        </div>
      </div>

      {/* 文本检测 */}
      <div className="card hover:transform-none space-y-2.5">
        <h3 className="font-semibold text-ink-800 dark:text-ink-100 text-sm">在线文本检测</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkText}
            onChange={(e) => setCheckText(e.target.value)}
            placeholder="输入任意文本检测是否包含敏感词..."
            className="input flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() => checkMutation.mutate()}
            disabled={!checkText.trim() || checkMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <FiSearch size={14} />
            <span>{checkMutation.isPending ? '检测中...' : '立即检测'}</span>
          </button>
        </div>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="card hover:transform-none space-y-3 border-l-4 border-l-vermilion">
          <h3 className="font-semibold text-ink-800 dark:text-ink-100 text-sm">添加单个敏感词</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">词汇</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="输入敏感词..."
                className="input text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">级别</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="input text-sm"
              >
                <option value="BLOCK">禁止</option>
                <option value="REVIEW">审核</option>
                <option value="WARN">警告</option>
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">分类</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="如：广告"
                className="input text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => addMutation.mutate()}
              disabled={!newWord.trim() || addMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {addMutation.isPending ? '添加中...' : '确认添加'}
            </button>
          </div>
        </div>
      )}

      {/* 批量添加 */}
      {showBatch && (
        <div className="card hover:transform-none space-y-3 border-l-4 border-l-vermilion">
          <h3 className="font-semibold text-ink-800 dark:text-ink-100 text-sm">批量导入敏感词</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="w-28">
                <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">级别</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="input text-sm"
                >
                  <option value="BLOCK">禁止</option>
                  <option value="REVIEW">审核</option>
                  <option value="WARN">警告</option>
                </select>
              </div>
              <div className="w-36">
                <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">分类</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="如：广告"
                  className="input text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1">
                每行输入一个敏感词
              </label>
              <textarea
                value={batchWords}
                onChange={(e) => setBatchWords(e.target.value)}
                placeholder={'敏感词1\n敏感词2\n敏感词3'}
                className="input min-h-[120px] resize-none text-sm font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => batchMutation.mutate()}
              disabled={!batchWords.trim() || batchMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {batchMutation.isPending ? '导入中...' : '确认批量添加'}
            </button>
          </div>
        </div>
      )}

      {/* 词库列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-ink-400">加载中...</div>
      ) : words.length === 0 ? (
        <div className="card text-center py-12 hover:transform-none">
          <p className="text-sm text-ink-500 dark:text-ink-400">词库暂为空，点击右上角添加敏感词</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 hover:transform-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-paper-200/60 dark:bg-white/[0.04] border-b border-hairline-light dark:border-hairline-dark">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">词汇</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">级别</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">分类</th>
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">添加时间</th>
                  <th className="text-right px-5 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light dark:divide-hairline-dark">
                {words.map((item) => {
                  const idStr = String(item.id)
                  return (
                    <tr
                      key={idStr}
                      className="hover:bg-paper-200/40 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {editingId === idStr ? (
                        <td colSpan={5} className="px-5 py-3">
                          <EditRow
                            item={item}
                            onSave={(payload) => updateMutation.mutate({ id: idStr, ...payload })}
                            onCancel={() => setEditingId(null)}
                            isPending={updateMutation.isPending}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-5 py-3.5 text-sm font-medium text-ink-800 dark:text-ink-100">
                            {item.word}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (levelLabels[item.level] || levelLabels.WARN).color
                              }`}
                            >
                              {(levelLabels[item.level] || { label: item.level }).label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-ink-500 dark:text-ink-400">
                            {item.category || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-ink-400">
                            {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(idStr)}
                                className="p-1.5 text-ink-400 hover:text-vermilion rounded-xl"
                                title="编辑"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(idStr)}
                                className="p-1.5 text-ink-400 hover:text-rose-600 rounded-xl"
                                title="删除"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-ink-400">共 {pageData.totalElements} 条</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageData.first}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pageData.last}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EditRow({
  item,
  onSave,
  onCancel,
  isPending,
}: {
  item: SensitiveWordItem
  onSave: (data: { word?: string; level?: string; category?: string }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [word, setWord] = useState(item.word)
  const [level, setLevel] = useState(item.level)
  const [category, setCategory] = useState(item.category || '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        className="input text-xs w-40"
      />
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value as any)}
        className="input text-xs w-28"
      >
        <option value="BLOCK">禁止</option>
        <option value="REVIEW">审核</option>
        <option value="WARN">警告</option>
      </select>
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="分类"
        className="input text-xs w-32"
      />
      <button
        type="button"
        onClick={() => onSave({ word, level, category: category || undefined })}
        disabled={isPending}
        className="btn btn-primary btn-sm"
      >
        保存
      </button>
      <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
        取消
      </button>
    </div>
  )
}
