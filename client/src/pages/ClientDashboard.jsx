import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../utils/axios'

const ClientDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    // Block admin access - redirect to login
    if (!authLoading && user && user.role === 'admin') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
      return
    }
    
    // Require login
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user && user.role === 'client') {
      fetchData()
    }
  }, [user, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'projects') {
        const response = await axiosInstance.get('/client/projects')
        setProjects(response.data)
      } else if (activeTab === 'payments') {
        const response = await axiosInstance.get('/client/payments')
        setPayments(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to public projects if client endpoint fails
      if (activeTab === 'projects') {
        try {
          const response = await axiosInstance.get('/projects')
          setProjects(response.data)
        } catch (e) {
          console.error('Fallback failed:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'client') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <section className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800">
        <div className="container-custom py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Client Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {user.email}</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800">
        <div className="container-custom">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Payments
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-custom">
          {activeTab === 'projects' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Project Progress</h2>
              {projects.length === 0 ? (
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No projects assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="card p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{project.title}</h3>
                      {project.category && (
                        <span className="inline-block bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 text-xs px-3 py-1 rounded-full mb-3">
                          {project.category}
                        </span>
                      )}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {project.shortDescription || project.description}
                      </p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">75%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-dark-800 rounded-full h-2">
                          <div className="bg-accent-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-accent-600 hover:text-accent-700 font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Payment History</h2>
              <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {payment.invoice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {payment.project}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payments.length === 0 && (
                  <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                    No payment records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ClientDashboard

