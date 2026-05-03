interface ActionTypeBadgeProps {
  type: string
}

const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  // 认证操作
  LOGIN: { label: '登录', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  LOGOUT: { label: '登出', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  REGISTER: { label: '注册', color: 'text-green-700', bgColor: 'bg-green-100' },
  PASSWORD_CHANGE: { label: '修改密码', color: 'text-amber-700', bgColor: 'bg-amber-100' },

  // 文章操作
  BLOG_CREATE: { label: '创建文章', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  BLOG_UPDATE: { label: '更新文章', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  BLOG_DELETE: { label: '删除文章', color: 'text-red-700', bgColor: 'bg-red-100' },
  BLOG_PUBLISH: { label: '发布文章', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },

  // 用户操作
  USER_UPDATE: { label: '更新用户', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  USER_BAN: { label: '封禁用户', color: 'text-red-700', bgColor: 'bg-red-100' },
  USER_UNBAN: { label: '解封用户', color: 'text-green-700', bgColor: 'bg-green-100' },
  USER_DELETE: { label: '删除用户', color: 'text-red-700', bgColor: 'bg-red-100' },
  USER_PROMOTE: { label: '提升权限', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  USER_DEMOTE: { label: '降低权限', color: 'text-orange-700', bgColor: 'bg-orange-100' },

  // 管理操作
  CATEGORY_CREATE: { label: '创建分类', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  CATEGORY_UPDATE: { label: '更新分类', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  CATEGORY_DELETE: { label: '删除分类', color: 'text-red-700', bgColor: 'bg-red-100' },
  TAG_CREATE: { label: '创建标签', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  TAG_UPDATE: { label: '更新标签', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  TAG_DELETE: { label: '删除标签', color: 'text-red-700', bgColor: 'bg-red-100' },

  // 评论操作
  COMMENT_CREATE: { label: '发表评论', color: 'text-sky-700', bgColor: 'bg-sky-100' },
  COMMENT_DELETE: { label: '删除评论', color: 'text-red-700', bgColor: 'bg-red-100' },

  // 草稿操作
  DRAFT_CREATE: { label: '创建草稿', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  DRAFT_UPDATE: { label: '更新草稿', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  DRAFT_DELETE: { label: '删除草稿', color: 'text-red-700', bgColor: 'bg-red-100' },

  // 系统操作
  SYSTEM_CONFIG: { label: '系统配置', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  OTHER: { label: '其他', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

export default function ActionTypeBadge({ type }: ActionTypeBadgeProps) {
  const config = typeConfig[type] || { ...typeConfig.OTHER, label: type }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}
    >
      {config.label}
    </span>
  )
}
