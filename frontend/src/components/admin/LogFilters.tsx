import { FiX, FiCalendar } from 'react-icons/fi'

interface LogFiltersProps {
  filters: {
    actionType: string
    targetType: string
    startDate: string
    endDate: string
    success: string
  }
  onFilterChange: (key: string, value: string) => void
  onClear: () => void
  actionTypes: { value: string; label: string }[]
  targetTypes: { value: string; label: string }[]
}

export default function LogFilters({
  filters,
  onFilterChange,
  onClear,
  actionTypes,
  targetTypes,
}: LogFiltersProps) {
  const hasFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="card p-4 mb-6 hover:transform-none">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[170px]">
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1">
            操作类型
          </label>
          <select
            value={filters.actionType}
            onChange={(e) => onFilterChange('actionType', e.target.value)}
            className="input text-xs"
          >
            <option value="">全部操作</option>
            {actionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[170px]">
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1">
            目标类型
          </label>
          <select
            value={filters.targetType}
            onChange={(e) => onFilterChange('targetType', e.target.value)}
            className="input text-xs"
          >
            <option value="">全部目标</option>
            {targetTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1">
            开始日期
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="input text-xs pl-9"
            />
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={14} />
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1">
            结束日期
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="input text-xs pl-9"
            />
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={14} />
          </div>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-1">
            状态
          </label>
          <select
            value={filters.success}
            onChange={(e) => onFilterChange('success', e.target.value)}
            className="input text-xs"
          >
            <option value="">全部</option>
            <option value="true">成功</option>
            <option value="false">失败</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-end">
            <button type="button" onClick={onClear} className="btn btn-secondary btn-sm">
              <FiX size={14} />
              <span>清空</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
