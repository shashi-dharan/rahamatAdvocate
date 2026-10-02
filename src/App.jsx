import { Navigate, Route, Routes } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import GalleryPage from './pages/GalleryPage'
import PostBlogLoginPage from './pages/PostBlogLoginPage'
import PostBlogDashboardPage from './pages/PostBlogDashboardPage'
import PostBlogEditorPage from './pages/PostBlogEditorPage'
import DisclaimerModal from './components/DisclaimerModel'

function App() {
  return (
    <>
      {/* Global Overlay */}
      <DisclaimerModal />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/our-blog" element={<BlogPage />} />
          <Route path="/our-blog/:slug" element={<BlogPostPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/post-blog" element={<PostBlogLoginPage />} />
          <Route path="/post-blog/dashboard" element={<PostBlogDashboardPage />} />
          <Route path="/post-blog/new" element={<PostBlogEditorPage />} />
          <Route path="/post-blog/edit/:id" element={<PostBlogEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <SpeedInsights />
    </>
  )
}

export default App