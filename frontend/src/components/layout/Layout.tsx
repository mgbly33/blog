import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import OfflineIndicator from '../OfflineIndicator'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="site-backdrop" aria-hidden>
        <span className="site-backdrop-orb orb-a"></span>
        <span className="site-backdrop-orb orb-b"></span>
        <span className="site-backdrop-orb orb-c"></span>
      </div>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div key={location.pathname} className="route-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
      <OfflineIndicator />
    </div>
  )
}
