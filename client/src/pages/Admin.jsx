import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../utils/axios'

const Admin = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [contacts, setContacts] = useState([])
  const [users, setUsers] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [securityStats, setSecurityStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [securityFilter, setSecurityFilter] = useState({ severity: '', type: '' })
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    location: '',
    year: '',
    image: '',
    images: ''
  })
  const [editingProject, setEditingProject] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const categories = ['Commercial', 'Transportation', 'Water Infrastructure', 'Bridge Engineering', 'Industrial', 'Infrastructure']

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData()
    }
  }, [user, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'projects') {
        const response = await axiosInstance.get('/projects')
        setProjects(response.data)
      } else if (activeTab === 'contacts') {
        const response = await axiosInstance.get('/contacts')
        setContacts(response.data)
      } else if (activeTab === 'users') {
        const response = await axiosInstance.get('/users')
        setUsers(response.data)
      } else if (activeTab === 'security') {
        const [logsRes, statsRes] = await Promise.all([
          axiosInstance.get('/security/logs'),
          axiosInstance.get('/security/stats')
        ])
        setSecurityLogs(logsRes.data.logs || [])
        setSecurityStats(statsRes.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showMessage('error', error.response?.data?.error || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    try {
      // Process images - convert comma-separated string to array
      const formData = { ...projectForm }
      if (formData.images) {
        formData.images = formData.images
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0)
      }
      // If no images array but has main image, use that as first image
      if (!formData.images || formData.images.length === 0) {
        if (formData.image) {
          formData.images = [formData.image]
        }
      }
      // Ensure main image is set
      if (!formData.image && formData.images && formData.images.length > 0) {
        formData.image = formData.images[0]
      }

      if (editingProject) {
        await axiosInstance.put(`/projects/${editingProject.id}`, formData)
        showMessage('success', 'Project updated successfully!')
      } else {
        await axiosInstance.post('/projects', formData)
        showMessage('success', 'Project added successfully!')
      }
      setProjectForm({ title: '', description: '', shortDescription: '', category: '', location: '', year: '', image: '', images: '' })
      setEditingProject(null)
      fetchData()
    } catch (error) {
      console.error('Error saving project:', error)
      showMessage('error', 'Failed to save project')
    }
  }

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await axiosInstance.delete(`/projects/${id}`)
      showMessage('success', 'Project deleted successfully!')
      fetchData()
    } catch (error) {
      console.error('Error deleting project:', error)
      showMessage('error', error.response?.data?.error || 'Failed to delete project')
    }
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      shortDescription: project.shortDescription || '',
      category: project.category || '',
      location: project.location || '',
      year: project.year || '',
      image: project.image || '',
      images: project.images ? (Array.isArray(project.images) ? project.images.join(', ') : project.images) : ''
    })
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return
    try {
      await axiosInstance.delete(`/contacts/${id}`)
      showMessage('success', 'Contact message deleted!')
      fetchData()
    } catch (error) {
      console.error('Error deleting contact:', error)
      showMessage('error', error.response?.data?.error || 'Failed to delete contact')
    }
  }

  const handleMarkContactRead = async (id, read) => {
    try {
      await axiosInstance.put(`/contacts/${id}`, { read })
      fetchData()
    } catch (error) {
      console.error('Error updating contact:', error)
      showMessage('error', error.response?.data?.error || 'Failed to update contact')
    }
  }

  if (authLoading) {
    return (
      <div className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <section className="bg-white dark:bg-dark-900 shadow-sm">
        <div className="container-custom py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage projects, customers, and contact submissions</p>
        </div>
      </section>

      {/* Message Alert */}
      {message.text && (
        <div className="container-custom mt-4">
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

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
              Projects
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'contacts'
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Contact Messages ({contacts.filter(c => !c.read).length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap relative ${
                activeTab === 'security'
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Security
              {securityStats && securityStats.last24Hours > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {securityStats.last24Hours > 99 ? '99+' : securityStats.last24Hours}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-custom">
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-md sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {editingProject ? 'Edit Project' : 'Add New Project'}
                  </h2>
                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="Project title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Short Description
                      </label>
                      <textarea
                        rows="2"
                        value={projectForm.shortDescription}
                        onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="Brief project summary (shown on detail page)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Brief summary for project detail page</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Description *
                      </label>
                      <textarea
                        required
                        rows="4"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="Detailed project description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={projectForm.category}
                        onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Main Image URL
                      </label>
                      <input
                        type="url"
                        value={projectForm.image}
                        onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="https://images.unsplash.com/..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Primary image for project card</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Images (Gallery)
                      </label>
                      <textarea
                        rows="3"
                        value={projectForm.images}
                        onChange={(e) => setProjectForm({ ...projectForm, images: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="https://image1.com, https://image2.com, https://image3.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Comma-separated image URLs for project detail gallery</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={projectForm.location}
                        onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year
                      </label>
                      <input
                        type="text"
                        value={projectForm.year}
                        onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., 2024"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button type="submit" className="btn-primary flex-1">
                        {editingProject ? 'Update' : 'Add'} Project
                      </button>
                      {editingProject && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(null)
                            setProjectForm({ title: '', description: '', shortDescription: '', category: '', location: '', year: '', image: '', images: '' })
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Projects List */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">All Projects ({projects.length})</h2>
                    <button
                      onClick={fetchData}
                      className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  {loading ? (
                    <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-dark-800 max-h-[800px] overflow-y-auto">
                      {projects.map((project) => (
                        <div key={project.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm line-clamp-2">
                                {project.shortDescription || project.description}
                              </p>
                              {project.images && Array.isArray(project.images) && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {project.category && (
                                  <span className="text-xs bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 px-2 py-1 rounded">
                                    {project.category}
                                  </span>
                                )}
                                {project.location && (
                                  <span className="text-xs bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                    📍 {project.location}
                                  </span>
                                )}
                                {project.year && (
                                  <span className="text-xs bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                    📅 {project.year}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditProject(project)}
                                className="text-accent-600 hover:text-accent-700 px-3 py-1 rounded text-sm font-medium"
                                title="Edit project"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm font-medium"
                                title="Delete project"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <div className="p-6 text-center text-gray-600 dark:text-gray-400">No projects yet. Add your first project!</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Contact Form Submissions ({contacts.length})
                </h2>
                <button
                  onClick={fetchData}
                  className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-dark-800 max-h-[800px] overflow-y-auto">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className={`p-6 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${!contact.read ? 'bg-accent-50 dark:bg-accent-900/30' : 'bg-white dark:bg-dark-900'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h3>
                            {!contact.read && (
                              <span className="bg-accent-600 text-white text-xs px-2 py-1 rounded-full">New</span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                              <a href={`mailto:${contact.email}`} className="hover:text-accent-600">
                              📧 {contact.email}
                            </a>
                          </p>
                          {contact.phone && (
                            <p className="text-gray-600 dark:text-gray-400">
                              <a href={`tel:${contact.phone}`} className="hover:text-accent-600">
                                📞 {contact.phone}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(contact.date).toLocaleDateString()} {new Date(contact.date).toLocaleTimeString()}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkContactRead(contact.id, !contact.read)}
                              className={`text-xs px-3 py-1 rounded ${
                                contact.read 
                                  ? 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600' 
                                  : 'bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-800'
                              }`}
                            >
                              {contact.read ? 'Mark Unread' : 'Mark Read'}
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="text-red-600 hover:text-red-700 text-xs px-3 py-1 rounded bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-lg mt-3">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{contact.message}</p>
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="p-6 text-center text-gray-600 dark:text-gray-400">No contact messages yet</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-dark-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Registered Customers ({users.filter(u => u.role === 'client').length})
                </h2>
                <button
                  onClick={fetchData}
                  className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-dark-800 max-h-[800px] overflow-y-auto">
                  {users.filter(u => u.role === 'client').map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.username || 'User'}</h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            <a href={`mailto:${user.email}`} className="hover:text-accent-600">
                              📧 {user.email}
                            </a>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customer ID: {user.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 text-xs px-3 py-1 rounded-full">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === 'client').length === 0 && (
                    <div className="p-6 text-center text-gray-600 dark:text-gray-400">No registered customers yet</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Stats */}
              {securityStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Events</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{securityStats.total}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Last 24 Hours</h3>
                    <p className="text-3xl font-bold text-red-600">{securityStats.last24Hours}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">High Severity</h3>
                    <p className="text-3xl font-bold text-orange-600">{securityStats.bySeverity.high}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Attacks Detected</h3>
                    <p className="text-3xl font-bold text-yellow-600">{securityStats.recentAttacks.length}</p>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white dark:bg-dark-900 p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                    <select
                      value={securityFilter.severity}
                      onChange={(e) => setSecurityFilter({ ...securityFilter, severity: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={securityFilter.type}
                      onChange={(e) => setSecurityFilter({ ...securityFilter, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All</option>
                      <option value="Attack Detected">Attack Detected</option>
                      <option value="Request Logged">Request Logged</option>
                      <option value="Rate Limit Exceeded">Rate Limit Exceeded</option>
                      <option value="Error Response">Error Response</option>
                      <option value="IP Blocked">IP Blocked</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchData}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Logs */}
              <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-dark-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Security Logs ({securityLogs.length})
                  </h2>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-dark-800 max-h-[800px] overflow-y-auto">
                    {securityLogs
                      .filter(log => {
                        if (securityFilter.severity && log.severity !== securityFilter.severity) return false;
                        if (securityFilter.type && log.type !== securityFilter.type) return false;
                        return true;
                      })
                      .map((log) => (
                        <div
                          key={log.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${
                            log.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20' :
                            log.severity === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20' :
                            'bg-white dark:bg-dark-900'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  log.severity === 'high' ? 'bg-red-600 text-white' :
                                  log.severity === 'medium' ? 'bg-orange-600 text-white' :
                                  'bg-gray-600 text-white'
                                }`}>
                                  {log.severity.toUpperCase()}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{log.type}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{log.method} {log.path}</span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p><strong>IP:</strong> {log.ip}</p>
                                <p><strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                                {log.userEmail && <p><strong>User:</strong> {log.userEmail}</p>}
                                {log.userAgent && <p><strong>User Agent:</strong> <span className="text-xs">{log.userAgent}</span></p>}
                                {log.detections && log.detections.length > 0 && (
                                  <div className="mt-2">
                                    <p className="font-semibold text-red-600">Detected Threats:</p>
                                    <ul className="list-disc list-inside text-xs">
                                      {log.detections.map((det, idx) => (
                                        <li key={idx}>{det.type}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {log.requestBody && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-accent-600 hover:text-accent-700">View Request Body</summary>
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-dark-800 rounded text-xs overflow-auto">
                                      {JSON.stringify(log.requestBody, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {log.ip && log.ip !== 'unknown' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await axiosInstance.post('/security/block-ip', { ip: log.ip, reason: 'Blocked from security panel' });
                                      showMessage('success', `IP ${log.ip} blocked`);
                                      fetchData();
                                    } catch (error) {
                                      showMessage('error', 'Failed to block IP');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 text-xs px-3 py-1 rounded bg-red-50 dark:bg-red-900/30"
                                >
                                  Block IP
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {securityLogs.length === 0 && (
                      <div className="p-6 text-center text-gray-600 dark:text-gray-400">No security logs yet</div>
                    )}
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

export default Admin
