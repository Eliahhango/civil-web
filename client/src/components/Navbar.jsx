import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white/98 dark:bg-dark-950/98 backdrop-blur-sm shadow-elevated sticky top-0 z-50 border-b border-gray-200 dark:border-dark-800">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center shadow-professional transition-all duration-200 group-hover:bg-accent-700 flex-shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:inline">Nexus Engineering Partners</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 sm:hidden">Nexus</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link to="/services" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link to="/projects" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              Projects
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link to="/team" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              Team
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-accent-500 font-medium transition-colors duration-200 relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-600 group-hover:w-full transition-all duration-200"></span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {user ? (
              <div className="flex items-center space-x-6">
                <Link to="/dashboard" className="text-accent-500 hover:text-accent-400 font-medium transition-colors">
                  Dashboard
                </Link>
                <span className="text-gray-400 text-sm">Welcome, {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                Client Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-4 border-t border-gray-200 dark:border-dark-800 space-y-1">
            <Link to="/" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Home</Link>
            <Link to="/about" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">About</Link>
            <Link to="/services" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Services</Link>
            <Link to="/projects" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Projects</Link>
            <Link to="/team" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Team</Link>
            <Link to="/contact" className="block py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Contact</Link>
            <button
              onClick={toggleTheme}
              className="block w-full text-left py-2.5 px-4 text-gray-700 dark:text-gray-300 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2.5 px-4 text-accent-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Dashboard</Link>
                <span className="block py-2.5 px-4 text-gray-400 text-sm">Welcome, {user.email}</span>
                <button onClick={handleLogout} className="btn-secondary w-full text-sm py-2.5 mt-2">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary w-full text-sm py-2.5 block text-center mt-2">
                Client Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

