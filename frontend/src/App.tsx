import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import BlogDetail from './pages/BlogDetail'
import Editor from './pages/Editor'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Search from './pages/Search'
import MyContent from './pages/MyContent'
import Notifications from './pages/Notifications'
import TagBlogs from './pages/TagBlogs'
import NotFound from './pages/NotFound'
import SeriesList from './pages/SeriesList'
import SeriesDetail from './pages/SeriesDetail'
import ReadHistory from './pages/ReadHistory'
import Messages from './pages/Messages'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import BlogManagement from './pages/admin/BlogManagement'
import Categories from './pages/admin/Categories'
import Tags from './pages/admin/Tags'
import Logs from './pages/admin/Logs'
import Reports from './pages/admin/Reports'
import SensitiveWords from './pages/admin/SensitiveWords'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="blog/:id" element={<BlogDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="user/:username" element={<Profile />} />
        <Route path="tag/:tagId" element={<TagBlogs />} />
        <Route path="category/:categoryId" element={<Search />} />
        <Route path="series" element={<SeriesList />} />
        <Route path="series/:id" element={<SeriesDetail />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="editor" element={<Editor />} />
          <Route path="editor/:id" element={<Editor />} />
          <Route path="drafts" element={<Navigate to="/my-content?tab=drafts" replace />} />
          <Route path="my-content" element={<MyContent />} />
          <Route path="history" element={<ReadHistory />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin routes - separate layout */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="blogs" element={<BlogManagement />} />
          <Route path="series" element={<SeriesList />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tags" element={<Tags />} />
          <Route path="logs" element={<Logs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="sensitive-words" element={<SensitiveWords />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
