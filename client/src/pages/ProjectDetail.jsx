import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axiosInstance from '../utils/axios'
import ImageGallery from '../components/ImageGallery'

const ProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axiosInstance.get(`/projects/${id}`)
        setProject(response.data)
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  // Get project-specific images
  const getProjectImages = () => {
    if (!project) return []
    
    // If project has specific images array, use those
    if (project.images && Array.isArray(project.images) && project.images.length > 0) {
      return project.images
    }
    
    // Fallback to main image if available
    if (project.image) {
      return [project.image]
    }
    
    // Last resort: return empty array (will show placeholder)
    return []
  }

  const projectImages = getProjectImages()

  if (loading) {
    return (
      <div className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Project Not Found</h1>
          <Link to="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  // Get short description or use first part of full description
  const shortDescription = project.shortDescription || project.description?.split('.')[0] + '.' || project.description

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-gray-900 dark:text-white section-padding overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        </div>
        <div className="container-custom relative z-10">
          <Link to="/projects" className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors font-semibold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 drop-shadow-lg break-words">{project.title}</h1>
          {project.category && (
            <span className="inline-block bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold mb-4 border border-white/30 shadow-elevated">
              {project.category}
            </span>
          )}
          {shortDescription && (
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mt-4 leading-relaxed font-medium">
              {shortDescription}
            </p>
          )}
        </div>
      </section>

      {/* Image Gallery */}
      {projectImages.length > 0 && (
        <section className="section-padding bg-gray-50 dark:bg-dark-900">
          <div className="container-custom">
            <ImageGallery images={projectImages} title={project.title} />
          </div>
        </section>
      )}

      {/* Project Details */}
      <section className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="card p-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Project Overview</h2>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">{project.description}</p>
                
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Project Highlights</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-accent-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">State-of-the-art engineering solutions</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-accent-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">Sustainable and environmentally responsible design</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-accent-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">Completed on time and within budget</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-6 h-6 text-accent-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">Exceeded client expectations and quality standards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <div className="card p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Project Information</h3>
                <div className="space-y-4">
                  {project.location && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold">Location</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location}
                      </p>
                    </div>
                  )}
                  {project.year && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold">Year Completed</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.year}
                      </p>
                    </div>
                  )}
                  {project.category && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-semibold">Category</p>
                      <span className="inline-block bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-soft">
                        {project.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-accent-600 to-accent-700 text-white">
                <h3 className="text-xl font-bold mb-4">Interested in Similar Projects?</h3>
                <p className="mb-6 text-white/90">Let's discuss how we can help bring your vision to life.</p>
                <Link to="/contact" className="btn-primary bg-white text-accent-700 hover:bg-gray-100 w-full text-center block font-semibold">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProjectDetail
