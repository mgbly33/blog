import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { FiImage, FiSave, FiSend, FiCheckCircle } from 'react-icons/fi'
import { blogApi } from '@/api/blog'
import { categoryApi, tagApi } from '@/api/category'
import { seriesApi } from '@/api/series'
import { uploadApi } from '@/api/upload'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { invalidateBlogCollections } from '@/utils/queryInvalidation'
import ImageUploader from '@/components/ImageUploader'
import type { Category, Series, Tag } from '@/types'
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
    hint: '文章已公开发布。',
  },
  REJECTED: {
    ...REVIEW_STATUS_BASE.REJECTED,
    hint: '文章审核未通过，请修改后重新提交。',
  },
  SCHEDULED: {
    ...REVIEW_STATUS_BASE.SCHEDULED,
    hint: '文章将在指定时间自动发布。',
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
  const { id: routeId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const editId = routeId || searchParams.get('id')
  const draftIdParam = searchParams.get('draft')

  const { isAuthenticated, user } = useAuthStore()
  const { theme } = useUIStore()
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
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

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
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

  const categories: Category[] = categoriesData?.data || []
  const tags: Tag[] = tagsData?.data || []
  const seriesList: Series[] = (seriesData?.data?.content || []).filter((s) =>
    Boolean(s.title?.trim())
  )

  useEffect(() => {
    if (!blogData?.data) return
    const blog = blogData.data
    setTitle(blog.title || '')
    setContent(blog.rawContent || blog.content || '')
    setSummary(blog.summary || '')
    setCoverImage(blog.image || '')
    setSelectedCategoryId(blog.categoryId ? String(blog.categoryId) : '')
    setVisibility(blog.visibility || 'PUBLIC')
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
    setSelectedCategoryId(draft.categoryId ? String(draft.categoryId) : '')
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
    if (!mimeAllowed && !extAllowed) return '仅支持 JPG/PNG/GIF/WEBP 格式'
    if (file.size > 5 * 1024 * 1024) return '图片大小不能超过 5MB'
    return null
  }, [])

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
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
          toast.success('图片已插入正文')
        } else {
          setContent((prev) => prev.replace(placeholder, `<!-- 上传失败: ${file.name} -->`))
          toast.error(res.message || '图片上传失败')
        }
      } catch (err) {
        setContent((prev) => prev.replace(placeholder, `<!-- 上传失败: ${file.name} -->`))
        const serverMessage = (err as any)?.response?.data?.message || (err as Error)?.message
        toast.error(serverMessage || '图片上传失败')
      }
    },
    [validateImageFile]
  )

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>) => {
      const items = event.clipboardData.items
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue
        event.preventDefault()
        const file = item.getAsFile()
        if (!file) return
        await uploadAndInsertImage(file)
      }
    },
    [uploadAndInsertImage]
  )

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请先填写文章标题')
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
      toast.error('草稿保存失败')
    }
  }, [title, content, coverImage, selectedTags, saveImmediately])

  const publishPayload = useMemo(
    () => ({
      title,
      content,
      summary: summary || content.slice(0, 200),
      image: coverImage || undefined,
      categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
      visibility,
      tags: selectedTags.map((id) => Number(id)),
      publishAt: scheduleMode ? toIsoDateTime(publishAt) : undefined,
      unpublishAt: scheduleMode ? toIsoDateTime(unpublishAt) : undefined,
      seriesId: selectedSeriesId ? Number(selectedSeriesId) : undefined,
      chapterOrder: chapterOrder === '' ? undefined : chapterOrder,
    }),
    [
      title,
      content,
      summary,
      coverImage,
      selectedCategoryId,
      visibility,
      selectedTags,
      scheduleMode,
      publishAt,
      unpublishAt,
      selectedSeriesId,
      chapterOrder,
    ]
  )

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
        toast.success(editId ? '文章修改已提交，等待管理员审核' : '文章已提交，等待管理员审核')
      } else if (status === 'SCHEDULED') {
        toast.success('文章已加入定时发布队列')
      } else {
        toast.success(editId ? '文章更新已发布' : '文章已成功发布')
      }
      navigate(`/blog/${response.data.id}`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message
      toast.error(message || '发布失败')
    },
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const charCount = content.replace(/\s+/g, '').length
  const estimatedMinutes = Math.max(1, Math.ceil(charCount / 400))

  if (!isAuthenticated) return null

  const currentBlogStatus = blogData?.data?.status
  const statusMeta = currentBlogStatus ? REVIEW_STATUS_META[currentBlogStatus] : null

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="pb-6 border-b border-hairline-light dark:border-hairline-dark flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-editorial-mono uppercase tracking-[0.22em] text-vermilion font-semibold">
            BLOG EDITOR · {editId ? 'EDIT POST' : 'NEW POST'}
          </p>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50">
            {editId ? '编辑博客文章' : '撰写新文章'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-editorial-mono text-ink-400">
            <span>{charCount} 字</span>
            <span>·</span>
            <span>预计阅读 {estimatedMinutes} 分钟</span>
            {statusMeta && (
              <>
                <span>·</span>
                <span className="text-vermilion font-semibold">状态：{statusMeta.label}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lastSavedAt && (
            <span className="inline-flex items-center gap-1.5 text-xs font-editorial-mono text-ink-400">
              <FiCheckCircle size={13} className="text-vermilion" />
              {saveStatus === 'saving'
                ? '保存中...'
                : `已自动保存 ${lastSavedAt.toLocaleTimeString()}`}
            </span>
          )}

          {!editId && (
            <button onClick={handleSaveDraft} className="btn btn-secondary" type="button">
              <FiSave size={14} />
              <span>存为草稿</span>
            </button>
          )}

          <button
            onClick={() => publishMutation.mutate()}
            className="btn btn-primary"
            type="button"
            disabled={publishMutation.isPending || !title.trim() || !content.trim()}
          >
            <FiSend size={14} />
            <span>
              {publishMutation.isPending
                ? '正在发布...'
                : isAdminUser
                  ? scheduleMode && publishAt
                    ? '定时发布'
                    : '立即发布'
                  : '提交发布'}
            </span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Markdown Editor */}
        <div className="lg:col-span-8 space-y-5">
          <div>
            <input
              className="w-full bg-transparent border-0 border-b border-hairline-light dark:border-hairline-dark pb-3 font-editorial-serif text-2xl sm:text-4xl font-bold text-ink-900 dark:text-ink-50 placeholder:text-ink-300 dark:placeholder:text-ink-600 focus:outline-none focus:border-vermilion transition-colors"
              placeholder="在此输入文章标题..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div>
            <textarea
              className="input min-h-[76px] resize-y font-reading-serif italic text-base"
              placeholder="填写文章摘要导语（可选，未填写将自动提取正文前 200 字）..."
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>

          <div data-color-mode={theme} onPaste={handlePaste}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              height={560}
              preview="live"
              extraCommands={[
                commands.group([], {
                  name: 'image-upload',
                  groupName: 'image',
                  icon: (
                    <span
                      title="上传图片"
                      onClick={() => document.getElementById('md-image-upload')?.click()}
                    >
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
        </div>

        {/* Right 4 Cols: Metadata Sidebar */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 lg:self-start">
          {/* Cover Image */}
          <div className="card space-y-3 hover:transform-none">
            <h3 className="text-[11px] font-editorial-mono font-semibold uppercase tracking-[0.2em] text-ink-900 dark:text-ink-100 pb-2 border-b border-hairline-light dark:border-hairline-dark">
              文章封面 · Cover
            </h3>
            <p className="text-xs text-ink-400">
              未上传封面时，系统将根据文章标题自动生成莫兰迪色系排版封面。
            </p>
            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              onRemove={() => setCoverImage('')}
            />
          </div>

          {/* Category & Visibility */}
          <div className="card space-y-4 hover:transform-none">
            <h3 className="text-[11px] font-editorial-mono font-semibold uppercase tracking-[0.2em] text-ink-900 dark:text-ink-100 pb-2 border-b border-hairline-light dark:border-hairline-dark">
              分类与可见性 · Category
            </h3>
            <div>
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1.5">
                文章分类
              </label>
              <select
                className="input text-xs"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">未选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-500 dark:text-ink-300 mb-1.5">
                阅读权限
              </label>
              <select
                className="input text-xs"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
              >
                <option value="PUBLIC">公开可见（推荐）</option>
                <option value="PRIVATE">仅自己可见（私密）</option>
              </select>
            </div>
          </div>

          {/* Topic Tags */}
          <div className="card space-y-3 hover:transform-none">
            <h3 className="text-[11px] font-editorial-mono font-semibold uppercase tracking-[0.2em] text-ink-900 dark:text-ink-100 pb-2 border-b border-hairline-light dark:border-hairline-dark">
              话题标签 · Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-xs text-ink-400">暂无可选标签</span>
              ) : (
                tags.map((tag: Tag) => {
                  const selected = selectedTags.includes(String(tag.id))
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(String(tag.id))}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        selected
                          ? 'bg-vermilion text-white border-vermilion'
                          : 'border-hairline-light dark:border-hairline-dark text-ink-600 dark:text-ink-300 hover:border-vermilion/50'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Series Assignment */}
          <div className="card space-y-3 hover:transform-none">
            <div className="flex items-center justify-between pb-2 border-b border-hairline-light dark:border-hairline-dark">
              <h3 className="text-[11px] font-editorial-mono font-semibold uppercase tracking-[0.2em] text-ink-900 dark:text-ink-100">
                所属专栏 · Series
              </h3>
              <Link
                to="/series"
                className="text-[11px] font-editorial-mono text-vermilion hover:underline"
              >
                {isAdminUser ? '管理专栏' : '查看专栏'} →
              </Link>
            </div>
            <select
              className="input text-xs"
              value={selectedSeriesId}
              onChange={(event) => setSelectedSeriesId(event.target.value)}
            >
              <option value="">独立单篇（不归入专栏）</option>
              {seriesList.map((series) => (
                <option key={series.id} value={series.id}>
                  {series.title}
                </option>
              ))}
            </select>

            {selectedSeriesId && (
              <div className="pt-1">
                <label className="block text-xs text-ink-400 mb-1">章节序号</label>
                <input
                  type="number"
                  className="input text-xs"
                  min={1}
                  value={chapterOrder}
                  onChange={(event) =>
                    setChapterOrder(event.target.value ? Number(event.target.value) : '')
                  }
                />
              </div>
            )}
          </div>

          {/* Schedule Publication */}
          <div className="card space-y-3 hover:transform-none">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[11px] font-editorial-mono font-semibold uppercase tracking-[0.2em] text-ink-900 dark:text-ink-100">
                定时发布 · Schedule
              </span>
              <input
                type="checkbox"
                checked={scheduleMode}
                onChange={(event) => setScheduleMode(event.target.checked)}
                className="accent-[#9E6B52]"
              />
            </label>

            {scheduleMode && (
              <div className="space-y-3 pt-2 border-t border-hairline-light dark:border-hairline-dark">
                <div>
                  <label className="block text-xs text-ink-400 mb-1">自动发布时间</label>
                  <input
                    type="datetime-local"
                    className="input text-xs"
                    value={publishAt}
                    onChange={(event) => setPublishAt(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-400 mb-1">自动下线归档时间</label>
                  <input
                    type="datetime-local"
                    className="input text-xs"
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
