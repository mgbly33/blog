import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 输出错误日志，便于排查白屏问题
    console.error('应用发生未捕获异常:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <div className="card py-12 text-center">
              <h1 className="text-2xl font-bold text-gray-800">页面渲染失败</h1>
              <p className="mt-2 text-gray-500">已拦截异常，避免白屏。你可以刷新页面后重试。</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button type="button" onClick={this.handleReload} className="btn btn-primary">
                  刷新页面
                </button>
                <Link to="/" className="btn btn-secondary">
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
