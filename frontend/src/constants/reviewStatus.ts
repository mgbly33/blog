export const REVIEW_STATUS_META = {
  PENDING: {
    label: '待审核',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  APPROVED: {
    label: '已通过',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  REJECTED: {
    label: '未通过',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  },
  SCHEDULED: {
    label: '定时发布',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  ARCHIVED: {
    label: '已归档',
    badgeClass: 'bg-ink-500/15 text-ink-600 dark:text-ink-300',
  },
} as const

export type ReviewStatus = keyof typeof REVIEW_STATUS_META
