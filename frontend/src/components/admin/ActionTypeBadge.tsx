interface ActionTypeBadgeProps {
  type: string
}

const typeConfig: Record<string, { label: string; classes: string }> = {
  LOGIN: { label: '登录', classes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  LOGOUT: { label: '登出', classes: 'bg-ink-500/15 text-ink-600 dark:text-ink-300' },
  REGISTER: { label: '注册', classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  PASSWORD_CHANGE: { label: '修改密码', classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  BLOG_CREATE: { label: '创建文章', classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  BLOG_UPDATE: { label: '更新文章', classes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  BLOG_DELETE: { label: '删除文章', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  BLOG_PUBLISH: { label: '发布文章', classes: 'bg-vermilion/15 text-vermilion' },
  USER_UPDATE: { label: '更新用户', classes: 'bg-vermilion/15 text-vermilion' },
  USER_BAN: { label: '封禁用户', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  USER_UNBAN: { label: '解封用户', classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  USER_DELETE: { label: '删除用户', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  USER_PROMOTE: { label: '设为管理员', classes: 'bg-vermilion/15 text-vermilion' },
  USER_DEMOTE: { label: '撤销管理员', classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  CATEGORY_CREATE: { label: '创建分类', classes: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  CATEGORY_UPDATE: { label: '更新分类', classes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  CATEGORY_DELETE: { label: '删除分类', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  TAG_CREATE: { label: '创建标签', classes: 'bg-vermilion/15 text-vermilion' },
  TAG_UPDATE: { label: '更新标签', classes: 'bg-vermilion/15 text-vermilion' },
  TAG_DELETE: { label: '删除标签', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  COMMENT_CREATE: { label: '发表评论', classes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  COMMENT_DELETE: { label: '删除评论', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  DRAFT_CREATE: { label: '创建草稿', classes: 'bg-ink-500/15 text-ink-600 dark:text-ink-300' },
  DRAFT_UPDATE: { label: '更新草稿', classes: 'bg-ink-500/15 text-ink-600 dark:text-ink-300' },
  DRAFT_DELETE: { label: '删除草稿', classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  SYSTEM_CONFIG: { label: '系统配置', classes: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  OTHER: { label: '其他', classes: 'bg-ink-500/15 text-ink-600 dark:text-ink-300' },
}

export default function ActionTypeBadge({ type }: ActionTypeBadgeProps) {
  const config = typeConfig[type] || { ...typeConfig.OTHER, label: type }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
