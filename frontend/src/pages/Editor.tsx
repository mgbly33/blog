import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { FiImage, FiSave, FiSend } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { tagApi } from '@/api/category'
import { seriesApi } from '@/api/series'
import { uploadApi } from '@/api/upload'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/stores/authStore'
import { invalidateBlogCollections } from '@/utils/queryInvalidation'
import ImageUploader from '@/components/ImageUploader'
import type { Series, Tag } from '@/types'
import { REVIEW_STATUS_META as REVIEW_STATUS_BASE } from '@/constants/reviewStatus'

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp'

const REVIEW_STATUS_META: Record<string, { label: string; badgeClass: string; hint: string }> = {
  PENDING: {
    ...REVIEW_STATUS_BASE.PENDING,
    hint: '文章已提交，等待管理员审核。',
  },
  APPROVED: {
    ...REVIEW_STATUS_BASE.APPROVED,
    hint: '文章已公开可见。',
  },
  REJECTED: {
    ...REVIEW_STATUS_BASE.REJECTED,
    hint: '文章审核未通过，请修改后再次提交。',
  },
  SCHEDULED: {
    ...REVIEW_STATUS_BASE.SCHEDULED,
    hint: '文章会在设定时间自动发布。',
  },
  ARCHIVED: {
    ...REVIEW_STATUS_BASE.ARCHIVED,
    hint: '文章当前处于归档状态。',
  },
}

const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

const toIsoDateTime = (value?: string): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export default function Editor() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const draftIdParam = searchParams.get('draft')

  const { isAuthenticated, user } = useAuthStore()
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [chapterOrder, setChapterOrder] = useState<number | ''>('')
  const [scheduleMode, setScheduleMode] = useState(false)
  const [publishAt, setPublishAt] = useState('')
  const [unpublishAt, setUnpublishAt] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const { data: blogData } = useQuery({
    queryKey: ['blog', editId],
    queryFn: () => blogApi.getBlog(editId!),
    enabled: Boolean(editId),
  })

  const { data: draftData } = useQuery({
    queryKey: ['draft', draftIdParam],
    queryFn: () => blogApi.getDraft(draftIdParam!),
    enabled: Boolean(draftIdParam) && !editId,
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getAll(),
  })

  const { data: seriesData } = useQuery({
    queryKey: ['series-list'],
    queryFn: () => seriesApi.getSeriesList(),
    enabled: isAuthenticated,
  })

  const tags = tagsData?.data || []
  const seriesList: Series[] = seriesData?.data?.content || []

  useEffect(() => {
    if (!blogData?.data) return
    const blog = blogData.data
    setTitle(blog.title || '')
    setContent(blog.rawContent || blog.content || '')
    setSummary(blog.summary || '')
    setCoverImage(blog.image || '')
    setSelectedTags((blog.tags || []).map((id) => String(id)))
    setSelectedSeriesId(blog.seriesId ? String(blog.seriesId) : '')
    setChapterOrder(blog.chapterOrder ?? '')
    if (blog.publishAt) {
      setScheduleMode(true)
      setPublishAt(toDateTimeLocalValue(blog.publishAt))
    } else {
      setScheduleMode(false)
      setPublishAt('')
    }
    setUnpublishAt(toDateTimeLocalValue(blog.unpublishAt))
  }, [blogData])

  useEffect(() => {
    if (!draftData?.data || editId) return
    const draft = draftData.data
    setTitle(draft.title || '')
    setContent(draft.content || '')
    setSummary(draft.summary || '')
    setCoverImage(draft.image || '')
    setSelectedTags((draft.tags || []).map((id) => String(id)))
  }, [draftData, editId])

  const { status: saveStatus, lastSavedAt, save, saveImmediately } = useAutoSave({
    draftId: draftIdParam || undefined,
    enabled: !editId,
  })

  useEffect(() => {
    if (!editId && (title || content)) {
      save({
        title,
        content,
        image: coverImage || undefined,
        tags: selectedTags,
      })
    }
  }, [editId, title, content, coverImage, selectedTags, save])

  const validateImageFile = useCallback((file: File): string | null => {
    const mime = (file.type || '').toLowerCase()
    const extAllowed = /\.(jpe?g|png|gif|webp)$/i.test(file.name || '')
    const mimeAllowed = ALLOWED_IMAGE_MIME_TYPES.includes(mime)
    if (!mimeAllowed && !extAllowed) return '仅支持JPG/PNG/GIF/WEBP格式'
    if (file.size > 5 * 1024 * 1024) return '图片大小不能超过5MB'
    return null
  }, [])

  const uploadAndInsertImage = useCallback(async (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      toast.error(error)
      return
    }

    const placeholder = `![上传中:${file.name}]()`
    setContent((prev) => `${prev}\n${placeholder}`)

    try {
      const res = await uploadApi.uploadImage(file)
      if (res.success && res.data) {
        setContent((prev) => prev.replace(placeholder, `![图片](${res.data})`))
        toast.success('图片上传成功')
      } else {
        setContent((prev) => prev.replace(placeholder, `<!-- 上传失败: ${file.name} -->`))
        toast.error(res.message || '图片上传失败')
      }
    } catch (err) {
      setContent((prev) => prev.replace(placeholder, `<!-- 上传失败: ${file.name} -->`))
      const serverMessage = (err as any)?.response?.data?.message || (err as Error)?.message
      toast.error(serverMessage || '图片上传失败')
    }
  }, [validateImageFile])

  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items
    for (const item of items) {
      if (!item.type.startsWith('image/')) continue
      event.preventDefault()
      const file = item.getAsFile()
      if (!file) return
      await uploadAndInsertImage(file)
    }
  }, [uploadAndInsertImage])

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入标题')
      return
    }
    try {
      await saveImmediately({
        title,
        content,
        image: coverImage || undefined,
        tags: selectedTags,
      })
      toast.success('草稿已保存')
    } catch {
      toast.error('保存失败')
    }
  }, [title, content, coverImage, selectedTags, saveImmediately])

  const publishPayload = useMemo(() => ({
    title,
    content,
    summary: summary || content.slice(0, 200),
    image: coverImage || undefined,
    tags: selectedTags,
    status: 'PUBLISHED' as const,
    publishAt: scheduleMode ? toIsoDateTime(publishAt) : undefined,
    unpublishAt: scheduleMode ? toIsoDateTime(unpublishAt) : undefined,
    seriesId: selectedSeriesId || undefined,
    chapterOrder: chapterOrder === '' ? undefined : chapterOrder,
  }), [title, content, summary, coverImage, selectedTags, scheduleMode, publishAt, unpublishAt, selectedSeriesId, chapterOrder])

  const publishMutation = useMutation({
    mutationFn: () => {
      if (editId) return blogApi.updateBlog(editId, publishPayload as any)
      return blogApi.createBlog(publishPayload as any)
    },
    onSuccess: (response) => {
      invalidateBlogCollections(queryClient)
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: ['user', user.username] })
      }
      const status = response.data?.status
      if (status === 'PENDING') {
        toast.success(editId ? '文章已更新并重新提交审核' : '文章已提交审核，请等待管理员处理')
      } else if (status === 'SCHEDULED') {
        toast.success('文章已通过审核，等待定时发布')
      } else {
        toast.success(editId ? '更新成功' : '发布成功')
      }
      navigate(`/blog/${response.data.id}`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message
      toast.error(message || '发布失败')
    },
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  if (!isAuthenticated) {
    return null
  }

  const currentBlogStatus = blogData?.data?.status
  const statusMeta = currentBlogStatus ? REVIEW_STATUS_META[currentBlogStatus] : null

  return (
    <div className="max-w-6xl mx-auto">
      <section className="sticky top-[84px] z-20 mb-6 rounded-xl border border-gray-200 bg-white/90 p-4 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{editId ? '编辑文章' : '写文章'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isAdminUser ? '管理员发布后可直接生效。' : '普通用户发布后将进入审核流程。'}
            </p>
            {statusMeta && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${statusMeta.badgeClass}`}>
                  当前状态：{statusMeta.label}
                </span>
                <span className="text-gray-500">{statusMeta.hint}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastSavedAt && (
              <span className="text-sm text-gray-500">
                {saveStatus === 'saving' ? '保存中...' : `已保存于 ${lastSavedAt.toLocaleTimeString()}`}
              </span>
            )}
            {!editId && (
              <button onClick={handleSaveDraft} className="btn btn-secondary" type="button">
                <FiSave size={16} />
                保存草稿
              </button>
            )}
            <button
              onClick={() => publishMutation.mutate()}
              className="btn btn-primary"
              type="button"
              disabled={publishMutation.isPending || !title.trim() || !content.trim()}
            >
              <FiSend size={16} />
              <span>
                {publishMutation.isPending
                  ? (isAdminUser ? '发布中...' : '提交中...')
                  : (isAdminUser ? (scheduleMode && publishAt ? '定时发布' : '发布') : '提交审核')}
              </span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <main className="space-y-4">
          <input
            className="input text-xl font-semibold"
            placeholder="文章标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            className="input min-h-[84px] resize-y"
            placeholder="摘要（可选）"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />

          <ImageUploader value={coverImage} onChange={setCoverImage} onRemove={() => setCoverImage('')} />

          <div data-color-mode="light" onPaste={handlePaste}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              height={520}
              preview="live"
              extraCommands={[
                commands.group([], {
                  name: 'image-upload',
                  groupName: 'image',
                  icon: (
                    <span onClick={() => document.getElementById('md-image-upload')?.click()}>
                      <FiImage />
                    </span>
                  ),
                  execute: () => document.getElementById('md-image-upload')?.click(),
                }),
              ]}
            />
            <input
              id="md-image-upload"
              type="file"
              className="hidden"
              accept={ALLOWED_IMAGE_ACCEPT}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (file) await uploadAndInsertImage(file)
                event.target.value = ''
              }}
            />
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-[180px] lg:self-start">
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => {
                const selected = selectedTags.includes(String(tag.id))
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(String(tag.id))}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selected ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    #{tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-bold text-gray-800">所属专栏（可选）</h3>
              <Link to="/series" className="text-sm text-primary-600 hover:text-primary-700">
                {isAdminUser ? '管理专栏' : '查看专栏'}
              </Link>
            </div>
            <p className="mb-2 text-xs text-gray-500">专栏由管理员统一创建和维护，发布文章时可选择归属专栏。</p>
            <select className="input" value={selectedSeriesId} onChange={(event) => setSelectedSeriesId(event.target.value)}>
              <option value="">不选择专栏</option>
              {seriesList.map((series) => (
                <option key={series.id} value={series.id}>
                  {series.title}
                </option>
              ))}
            </select>
            {seriesList.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">当前暂无可选专栏，请联系管理员创建专栏。</p>
            )}
            {selectedSeriesId && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">章节序号</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={chapterOrder}
                  onChange={(event) => setChapterOrder(event.target.value ? Number(event.target.value) : '')}
                />
              </div>
            )}
          </div>

          <div className="card">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <input
                type="checkbox"
                checked={scheduleMode}
                onChange={(event) => setScheduleMode(event.target.checked)}
              />
              启用定时发布
            </label>
            {!isAdminUser && (
              <p className="mb-3 text-xs text-amber-700">
                普通用户提交后需管理员审核，通过后才会公开；若设置了发布时间，审核通过后会按计划发布。
              </p>
            )}
            {scheduleMode && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">发布时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={publishAt}
                    onChange={(event) => setPublishAt(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">下线时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={unpublishAt}
                    onChange={(event) => setUnpublishAt(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
