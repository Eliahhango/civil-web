import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        if (!formData.username) {
          setError('Username is required')
          setLoading(false)
          return
        }
        result = await register(formData.email, formData.password, formData.username)
      }

      if (result.success) {
        // Redirect clients to dashboard, block admin access
        const userData = result.user || JSON.parse(localStorage.getItem('user') || '{}')
        if (userData.role === 'admin') {
          // Admin should use port 5000, clear and show message
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setError('Admin access is available at http://localhost:5000/admin. Please use the admin panel.')
          return
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
      </div>
      <div className="max-w-md w-full space-y-8 bg-white/98 dark:bg-dark-900/98 backdrop-blur-sm p-8 rounded-xl shadow-elevated border border-gray-200 dark:border-dark-700 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-accent-600 rounded-lg flex items-center justify-center shadow-professional transition-all duration-300 hover:shadow-elevated">
              <span className="text-white font-bold text-4xl">N</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLogin ? 'Client Login' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
            {isLogin
              ? 'Sign in to access your account'
              : 'Register for a new client account'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-medium shadow-soft">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-800 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required={!isLogin}
                value={formData.username}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-700 placeholder-gray-500 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-dark-800 transition-all"
                placeholder="Your username"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-dark-800 transition-all"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-dark-800 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setFormData({ email: '', password: '', username: '' })
              }}
              className="text-accent-500 hover:text-accent-400 font-semibold transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {isLogin && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
              <strong className="text-accent-600">Demo Credentials:</strong><br />
              <span className="text-gray-600 dark:text-gray-400">Admin: admin@nexusengineering.co.tz / admin123</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

