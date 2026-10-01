import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaChevronUp, FaWhatsapp } from 'react-icons/fa'
import Footer from './Footer'
import Header from './Header'

const titleByPath = {
  '/': 'RAHMAT ADVOCATE - JUSTICE FOR ALL',
  '/services': 'Services - RAHMAT ADVOCATE',
  '/contact-us': 'Contact Us - RAHMAT ADVOCATE',
  '/about-us': 'About Us - RAHMAT ADVOCATE',
  '/our-blog': 'Our Blog - RAHMAT ADVOCATE',
  '/gallery': 'Gallery - RAHMAT ADVOCATE',
}

function Layout({ children }) {
  const { pathname } = useLocation()
  const [showGoTop, setShowGoTop] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!pathname.startsWith('/our-blog/')) {
      document.title = titleByPath[pathname] || 'RAHMAT ADVOCATE'
    }
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      setShowGoTop(window.scrollY > 280)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const goToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />

      <a
        href="https://wa.me/919642066661?text=Hello%20Adv.%20Rahmat"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="floating-action fixed left-4 bottom-4 z-40 size-13 rounded-xl bg-[#25D366] text-white inline-flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,.25)]"
      >
        <FaWhatsapp size={28} />
      </a>

      {showGoTop ? (
        <button
          type="button"
          aria-label="Go to top"
          onClick={goToTop}
          className="fixed right-4 bottom-4 z-40 size-10 rounded-sm bg-(--primary) text-white inline-flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,.25)] hover:bg-(--primary-dark) transition-colors cursor-pointer"
        >
          <FaChevronUp size={20} />
        </button>
      ) : null}
    </>
  )
}

export default Layout
