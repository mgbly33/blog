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

  // Fetch logs
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

  // Fetch action types for filter
  const { data: actionTypesData } = useQuery({
    queryKey: ['log-action-types'],
    queryFn: adminApi.getActionTypes,
  })

  // Fetch target types for filter
  const { data: targetTypesData } = useQuery({
    queryKey: ['log-target-types'],
    queryFn: adminApi.getTargetTypes,
  })

  // Fetch statistics
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">操作日志</h1>
          <p className="text-gray-500">监控系统操作和用户活动</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">总日志数</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalLogs.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">今日</p>
            <p className="text-2xl font-bold text-blue-600">{stats.logsToday.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">失败操作</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedLogs.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">登录次数</p>
            <p className="text-2xl font-bold text-green-600">{stats.loginCount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <LogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        actionTypes={actionTypes}
        targetTypes={targetTypes}
      />

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FiActivity className="mx-auto text-gray-300" size={48} />
            <p className="mt-4 text-gray-500">暂无日志</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">时间</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">用户</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">操作</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">目标</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">网络地址</th>
                    <th className="text-center px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: OperationLog) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">
                          {log.operatorName || '匿名'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ActionTypeBadge type={log.actionType} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">{log.targetType}</span>
                          {log.targetName && (
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">
                              {log.targetName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 font-mono">
                          {log.ipAddress || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.success ? (
                          <span className="inline-flex items-center text-green-600" title="成功">
                            <FiCheckCircle size={18} />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center text-red-600"
                            title={log.errorMessage || '失败'}
                          >
                            <FiXCircle size={18} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                显示 {page * 20 + 1} - {Math.min((page + 1) * 20, totalElements)} 条，共 {totalElements} 条
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-600">
                  第 {page + 1} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
