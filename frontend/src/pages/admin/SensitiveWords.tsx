import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiRefreshCw, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { sensitiveWordApi, SensitiveWordItem } from '@/api/sensitiveWord'

const levelLabels: Record<string, { label: string; color: string }> = {
  BLOCK: { label: '禁止', color: 'bg-red-100 text-red-700' },
  REVIEW: { label: '审核', color: 'bg-yellow-100 text-yellow-700' },
  WARN: { label: '警告', color: 'bg-blue-100 text-blue-700' },
}

export default function SensitiveWords() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [checkText, setCheckText] = useState('')

  // 表单状态
  const [newWord, setNewWord] = useState('')
  const [newLevel, setNewLevel] = useState<string>('BLOCK')
  const [newCategory, setNewCategory] = useState('')
  const [batchWords, setBatchWords] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sensitive-words', page],
    queryFn: () => sensitiveWordApi.getWords(page, 20),
  })

  const addMutation = useMutation({
    mutationFn: () => sensitiveWordApi.addWord({ word: newWord, level: newLevel, category: newCategory || undefined }),
    onSuccess: () => {
      toast.success('添加成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'sensitive-words'] })
      setNewWord('')
      setNewCategory('')
      setShowAdd(false)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || '添加失败'),
  })

  const batchMutation = useMutation({
    mutationFn: () => {
      const words = batchWords.split('\n').map(w => w.trim()).filter(Boolean)
      return sensitiveWordApi.batchAddWords({ words, level: newLevel, category: newCategory || undefined })
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
    mutationFn: ({ id, ...data }: { id: string; word?: string; level?: string; category?: string }) =>
      sensitiveWordApi.updateWord(id, data),
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
        toast.success(`检测通过，未发现敏感词`)
      } else {
        const words = result.matches.map(m => m.word).join(', ')
        toast.error(`发现 ${result.matchCount} 个敏感词: ${words}`)
      }
    },
  })

  const reloadMutation = useMutation({
    mutationFn: () => sensitiveWordApi.reloadFilter(),
    onSuccess: (res) => {
      toast.success(`过滤器已重新加载（${res.data?.wordCount || 0} 个词）`)
    },
  })

  const words: SensitiveWordItem[] = data?.data?.content || []
  const pageData = data?.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">敏感词管理</h1>
          <p className="text-gray-500 mt-1">管理内容过滤词库</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => reloadMutation.mutate()}
            disabled={reloadMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <FiRefreshCw size={14} className={reloadMutation.isPending ? 'animate-spin' : ''} />
            <span>重载过滤器</span>
          </button>
          <button
            onClick={() => setShowBatch(!showBatch)}
            className="btn btn-secondary btn-sm"
          >
            <FiUpload size={14} />
            <span>批量添加</span>
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn btn-primary btn-sm"
          >
            <FiPlus size={14} />
            <span>添加敏感词</span>
          </button>
        </div>
      </div>

      {/* 文本检测 */}
      <div className="card">
        <h3 className="font-bold text-gray-700 mb-2 text-sm">文本检测</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkText}
            onChange={(e) => setCheckText(e.target.value)}
            placeholder="输入要检测的文本..."
            className="input flex-1 text-sm"
          />
          <button
            onClick={() => checkMutation.mutate()}
            disabled={!checkText.trim() || checkMutation.isPending}
            className="btn btn-secondary btn-sm"
          >
            <FiSearch size={14} />
            <span>{checkMutation.isPending ? '检测中...' : '检测'}</span>
          </button>
        </div>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="card border-primary-200 bg-primary-50/30">
          <h3 className="font-bold text-gray-700 mb-3">添加敏感词</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">词汇</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="输入敏感词..."
                className="input text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm text-gray-600 mb-1">级别</label>
              <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)} className="input text-sm">
                <option value="BLOCK">禁止</option>
                <option value="REVIEW">审核</option>
                <option value="WARN">警告</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-sm text-gray-600 mb-1">分类</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="如: 政治"
                className="input text-sm"
              />
            </div>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!newWord.trim() || addMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {addMutation.isPending ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      {/* 批量添加 */}
      {showBatch && (
        <div className="card border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-gray-700 mb-3">批量添加</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-28">
                <label className="block text-sm text-gray-600 mb-1">级别</label>
                <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)} className="input text-sm">
                  <option value="BLOCK">禁止</option>
                  <option value="REVIEW">审核</option>
                  <option value="WARN">警告</option>
                </select>
              </div>
              <div className="w-32">
                <label className="block text-sm text-gray-600 mb-1">分类</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="如: 广告"
                  className="input text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">每行一个敏感词</label>
              <textarea
                value={batchWords}
                onChange={(e) => setBatchWords(e.target.value)}
                placeholder="敏感词1&#10;敏感词2&#10;敏感词3"
                className="input min-h-[120px] resize-none text-sm font-mono"
              />
            </div>
            <button
              onClick={() => batchMutation.mutate()}
              disabled={!batchWords.trim() || batchMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {batchMutation.isPending ? '添加中...' : '批量添加'}
            </button>
          </div>
        </div>
      )}

      {/* 词库列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : words.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">词库为空，请添加敏感词</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">词汇</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">级别</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">分类</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">添加时间</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {words.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {editingId === item.id ? (
                      <EditRow
                        item={item}
                        onSave={(data) => updateMutation.mutate({ id: item.id, ...data })}
                        onCancel={() => setEditingId(null)}
                        isPending={updateMutation.isPending}
                      />
                    ) : (
                      item.word
                    )}
                  </td>
                  {editingId !== item.id && (
                    <>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(levelLabels[item.level] || levelLabels.WARN).color}`}>
                          {(levelLabels[item.level] || { label: item.level }).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{dayjs(item.createdAt).format('MM-DD HH:mm')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditingId(item.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded"
                            title="编辑"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`确定删除敏感词 "${item.word}"？`)) {
                                deleteMutation.mutate(item.id)
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                            title="删除"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {pageData.totalElements} 条</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={pageData.first} className="btn btn-secondary btn-sm disabled:opacity-50">上一页</button>
            <button onClick={() => setPage(p => p + 1)} disabled={pageData.last} className="btn btn-secondary btn-sm disabled:opacity-50">下一页</button>
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
    <div className="flex items-center gap-2 col-span-5">
      <input type="text" value={word} onChange={(e) => setWord(e.target.value)} className="input text-sm w-32" />
      <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="input text-sm w-24">
        <option value="BLOCK">禁止</option>
        <option value="REVIEW">审核</option>
        <option value="WARN">警告</option>
      </select>
      <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="分类" className="input text-sm w-24" />
      <button onClick={() => onSave({ word, level, category: category || undefined })} disabled={isPending} className="btn btn-primary btn-sm text-xs">
        保存
      </button>
      <button onClick={onCancel} className="btn btn-secondary btn-sm text-xs">取消</button>
    </div>
  )
}
