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
    console.error('应用发生未捕获异常:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-100 dark:bg-ink-900 text-ink-800 dark:text-ink-50 px-4 py-16 flex items-center justify-center">
          <div className="mx-auto max-w-xl w-full">
            <div className="card py-12 text-center hover:transform-none">
              <h1 className="font-editorial-serif text-2xl font-bold text-ink-900 dark:text-ink-50">
                页面渲染遇到异常
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                已拦截前端异常避免白屏，你可以刷新重试或返回博客首页。
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button type="button" onClick={this.handleReload} className="btn btn-primary btn-sm">
                  刷新页面
                </button>
                <Link to="/" onClick={this.handleReset} className="btn btn-secondary btn-sm">
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
