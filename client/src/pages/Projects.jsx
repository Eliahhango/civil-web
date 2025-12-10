import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosInstance from '../utils/axios'
import { ProjectIcon } from '../components/Icons'
import ProjectImage from '../components/ProjectImage'
import SearchBar from '../components/SearchBar'
import LoadingSkeleton from '../components/LoadingSkeleton'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchParams] = useSearchParams()

  const categories = ['All', 'Commercial', 'Transportation', 'Water Infrastructure', 'Bridge Engineering', 'Industrial', 'Infrastructure']

  // Category images mapping - each category has a representative image
  const categoryImages = {
    'All': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'Commercial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'Transportation': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'Water Infrastructure': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
    'Bridge Engineering': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    'Industrial': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop',
    'Infrastructure': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  }

  const filterProjects = (projectsList, search = searchTerm, category = selectedCategory) => {
    let filtered = projectsList

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category)
    }

    // Filter by search term
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch) ||
        (p.location && p.location.toLowerCase().includes(lowerSearch)) ||
        (p.category && p.category.toLowerCase().includes(lowerSearch))
      )
    }

    setFilteredProjects(filtered)
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    filterProjects(projects, term, selectedCategory)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    filterProjects(projects, searchTerm, category)
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axiosInstance.get('/projects')
        setProjects(response.data)
        
        // Check for search param
        const search = searchParams.get('search')
        if (search) {
          setSearchTerm(search)
          filterProjects(response.data, search, selectedCategory)
        } else {
          setFilteredProjects(response.data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [searchParams])

  if (loading) {
    return (
      <div>
        <section className="relative bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 text-gray-900 dark:text-white section-padding overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container-custom relative z-10">
            <div className="h-12 bg-white/20 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded w-96 animate-pulse"></div>
          </div>
        </section>
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <LoadingSkeleton key={i} type="project" />
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-white section-padding overflow-hidden bg-gradient-dark">
        <div className="container-custom relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
            Our <span className="text-white">Projects</span>
          </h1>
          <p className="text-base sm:text-lg text-white/90 max-w-3xl">
            Showcasing our portfolio of successful engineering projects that demonstrate innovation, quality, and excellence.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-accent-600 text-white shadow-medium'
                    : 'bg-white dark:bg-dark-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-dark-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Results count */}
          {(searchTerm || selectedCategory !== 'All') && (
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Showing {filteredProjects.length} of {projects.length} projects
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <ProjectIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-4">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'No projects found matching your criteria.' 
                  : 'No projects available at the moment.'}
              </p>
              {(searchTerm || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('All')
                    setFilteredProjects(projects)
                  }}
                  className="text-accent-500 hover:text-accent-400 font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="card overflow-hidden card-hover"
                >
                  <div className="h-56 relative overflow-hidden bg-gray-200">
                    <ProjectImage project={project} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    {project.category && (
                      <span className="absolute top-4 right-4 bg-accent-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-soft">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link to={`/projects/${project.id}`} className="hover:text-accent-500 transition-colors">
                        {project.title}
                      </Link>
                    </h3>
                    <p className="text-body mb-4 line-clamp-3">
                      {project.shortDescription || project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-gray-100">
                      {project.location && (
                        <div className="flex items-center text-gray-600 text-xs bg-gray-100 px-3 py-1.5 rounded-full">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {project.location}
                        </div>
                      )}
                      {project.year && (
                        <div className="flex items-center text-gray-600 text-xs bg-gray-100 px-3 py-1.5 rounded-full">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Completed {project.year}
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-accent-600 font-semibold hover:text-accent-700 transition-colors inline-flex items-center gap-2"
                    >
                      View Details
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="heading-medium text-gray-900 mb-4">Have a Project in Mind?</h2>
          <p className="text-body text-lg mb-8 max-w-2xl mx-auto">
            Let's collaborate to bring your engineering vision to reality with innovative solutions and proven expertise.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  )
}

export default Projects
