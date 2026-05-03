export const REVIEW_STATUS_META = {
  PENDING: {
    label: '待审核',
    badgeClass: 'bg-yellow-100 text-yellow-700',
  },
  APPROVED: {
    label: '已通过',
    badgeClass: 'bg-green-100 text-green-700',
  },
  REJECTED: {
    label: '未通过',
    badgeClass: 'bg-red-100 text-red-700',
  },
  SCHEDULED: {
    label: '已定时',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  ARCHIVED: {
    label: '已归档',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
} as const

export type ReviewStatus = keyof typeof REVIEW_STATUS_META
