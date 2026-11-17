import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiActivity, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { adminApi, OperationLog } from '@/api/admin'
import ActionTypeBadge from '@/components/admin/ActionTypeBadge'
import LogFilters from '@/components/admin/LogFilters'
import dayjs from 'dayjs'

export default function Logs() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({
    actionType: '',
    targetType: '',
    startDate: '',
    endDate: '',
    success: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page, filters],
    queryFn: () =>
      adminApi.getLogs(page, 20, {
        actionType: filters.actionType || undefined,
        targetType: filters.targetType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        success: filters.success ? filters.success === 'true' : undefined,
      }),
  })

  const { data: actionTypesData } = useQuery({
    queryKey: ['log-action-types'],
    queryFn: adminApi.getActionTypes,
  })

  const { data: targetTypesData } = useQuery({
    queryKey: ['log-target-types'],
    queryFn: adminApi.getTargetTypes,
  })

  const { data: statsData } = useQuery({
    queryKey: ['log-statistics'],
    queryFn: adminApi.getLogStatistics,
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const handleClearFilters = () => {
    setFilters({
      actionType: '',
      targetType: '',
      startDate: '',
      endDate: '',
      success: '',
    })
    setPage(0)
  }

  const logs = data?.data?.content || []
  const totalPages = data?.data?.totalPages || 0
  const totalElements = data?.data?.totalElements || 0
  const actionTypes = actionTypesData?.data || []
  const targetTypes = targetTypesData?.data || []
  const stats = statsData?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50">
          操作日志
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">查看平台关键操作与安全审计记录</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 hover:transform-none">
            <p className="text-xs text-ink-400">累计日志数</p>
            <p className="font-editorial-serif text-3xl font-bold text-ink-900 dark:text-ink-50 mt-1">
              {stats.totalLogs.toLocaleString()}
            </p>
          </div>
          <div className="card p-4 hover:transform-none">
            <p className="text-xs text-ink-400">今日新增</p>
            <p className="font-editorial-serif text-3xl font-bold text-vermilion mt-1">
              {stats.logsToday.toLocaleString()}
            </p>
          </div>
          <div className="card p-4 hover:transform-none">
            <p className="text-xs text-ink-400">失败操作</p>
            <p className="font-editorial-serif text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {stats.failedLogs.toLocaleString()}
            </p>
          </div>
          <div className="card p-4 hover:transform-none">
            <p className="text-xs text-ink-400">登录次数</p>
            <p className="font-editorial-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.loginCount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <LogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        actionTypes={actionTypes}
        targetTypes={targetTypes}
      />

      <div className="card p-0 overflow-hidden hover:transform-none">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-ink-400">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FiActivity className="mx-auto text-ink-300 dark:text-ink-600" size={44} />
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">暂无日志记录</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-paper-200/60 dark:bg-white/[0.04] border-b border-hairline-light dark:border-hairline-dark">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">时间</th>
                    <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">操作人</th>
                    <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">类型</th>
                    <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">目标</th>
                    <th className="text-left px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">IP 地址</th>
                    <th className="text-center px-6 py-3.5 text-xs font-medium text-ink-500 dark:text-ink-300">结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-light dark:divide-hairline-dark">
                  {logs.map((log: OperationLog) => (
                    <tr
                      key={log.id}
                      className="hover:bg-paper-200/40 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-4 text-xs text-ink-500 dark:text-ink-400 font-editorial-mono">
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-ink-800 dark:text-ink-100">
                          {log.operatorName || '匿名'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ActionTypeBadge type={log.actionType} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-ink-600 dark:text-ink-300">
                            {log.targetType}
                          </span>
                          {log.targetName && (
                            <span className="text-[11px] text-ink-400 truncate max-w-[200px]">
                              {log.targetName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-ink-400 font-editorial-mono">
                          {log.ipAddress || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.success ? (
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400" title="成功">
                            <FiCheckCircle size={16} />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-rose-600 dark:text-rose-400"
                            title={log.errorMessage || '失败'}
                          >
                            <FiXCircle size={16} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-hairline-light dark:border-hairline-dark text-xs">
              <p className="text-ink-400">
                显示 {page * 20 + 1} - {Math.min((page + 1) * 20, totalElements)} 条，共 {totalElements} 条
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 text-ink-400 hover:text-ink-800 dark:hover:text-ink-100 disabled:opacity-40"
                >
                  <FiChevronLeft size={18} />
                </button>
                <span className="text-ink-600 dark:text-ink-300">
                  {page + 1} / {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 text-ink-400 hover:text-ink-800 dark:hover:text-ink-100 disabled:opacity-40"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
