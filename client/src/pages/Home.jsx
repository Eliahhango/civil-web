import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axiosInstance from '../utils/axios'
import { BuildingIcon, WaterIcon, BridgeIcon, RoadIcon, DocumentIcon, ChartIcon, ProjectIcon } from '../components/Icons'
import Testimonials from '../components/Testimonials'
import Statistics from '../components/Statistics'
import ProjectImage from '../components/ProjectImage'

const Home = () => {
  const [projects, setProjects] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const iconMap = {
    building: BuildingIcon,
    water: WaterIcon,
    bridge: BridgeIcon,
    road: RoadIcon,
    document: DocumentIcon,
    chart: ChartIcon
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, servicesRes] = await Promise.all([
          axiosInstance.get('/projects'),
          axiosInstance.get('/services')
        ])
        setProjects(projectsRes.data.slice(0, 6))
        setServices(servicesRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        </div>
        
        <div className="container-custom section-padding relative z-10">
          <div className="max-w-4xl fade-in-up">
            <div className="inline-block bg-gray-900/10 dark:bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-8 border border-gray-300 dark:border-white/20">
              <p className="text-gray-900 dark:text-white text-sm font-medium tracking-wide">Premier Engineering Solutions</p>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Building Tomorrow's
              <span className="block mt-2 text-gray-900 dark:text-white">Infrastructure Today</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-white/90 mb-6 sm:mb-10 leading-relaxed max-w-3xl">
              Nexus Engineering Partners delivers innovative engineering solutions that shape the future of infrastructure. With cutting-edge technology and proven expertise, we transform visions into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/services" className="btn-primary text-center inline-flex items-center justify-center">
                Explore Our Services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/projects" className="btn-secondary bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-800 hover:border-accent-500 text-center inline-flex items-center justify-center">
                View Portfolio
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="heading-medium text-gray-900 dark:text-gray-100 mb-4">
              Our <span className="text-gradient">Services</span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg max-w-3xl mx-auto">
              Comprehensive engineering consulting services designed to meet the most demanding project requirements with precision and excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon] || BuildingIcon
              return (
                <div
                  key={service.id}
                  className="card p-8 card-hover fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="bg-gray-100 dark:bg-dark-800 w-14 h-14 rounded-lg flex items-center justify-center mb-6 transition-colors duration-200 group-hover:bg-gray-200 dark:group-hover:bg-dark-700">
                    <IconComponent className="w-7 h-7 text-accent-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{service.title}</h3>
                  <p className="text-body mb-6">{service.description}</p>
                  <Link
                    to="/services"
                    className="text-accent-500 font-semibold hover:text-accent-400 transition-colors inline-flex items-center gap-2"
                  >
                    Learn more
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-12 fade-in-up">
            <Link to="/services" className="btn-primary inline-flex items-center">
              View All Services
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="heading-medium text-gray-900 dark:text-gray-100 mb-4">
              Why Choose <span className="text-gradient">Nexus Engineering Partners?</span>
            </h2>
            <p className="text-body text-lg max-w-3xl mx-auto">
              We combine decades of engineering excellence with innovative solutions to deliver projects that exceed expectations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-dark-800 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Expert Team</h3>
              <p className="text-body">
                Our multidisciplinary team of certified engineers brings together decades of combined experience across all engineering disciplines.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-dark-800 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Quality Excellence</h3>
              <p className="text-body">
                We maintain the highest international standards, ensuring every project meets rigorous quality benchmarks and regulatory compliance.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-dark-800 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Timely Delivery</h3>
              <p className="text-body">
                Our proven project management methodologies ensure on-time delivery without compromising quality or safety standards.
              </p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <div className="inline-block bg-accent-600 text-white px-12 py-10 rounded-lg shadow-large">
              <p className="text-6xl font-bold mb-2">25+</p>
              <p className="text-xl font-semibold">Years of Excellence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="section-padding bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="heading-medium text-gray-900 dark:text-gray-100 mb-4">
              Featured <span className="text-gradient">Projects</span>
            </h2>
            <p className="text-body text-lg max-w-3xl mx-auto">
              Discover our portfolio of successful engineering projects that showcase innovation, quality, and excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="card overflow-hidden card-hover fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    <Link to={`/projects/${project.id}`} className="hover:text-accent-500 transition-colors">
                      {project.title}
                    </Link>
                  </h3>
                  <p className="text-body mb-4 line-clamp-3">
                    {project.shortDescription || project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
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
                        {project.year}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-accent-500 font-semibold hover:text-accent-400 transition-colors inline-flex items-center gap-2"
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
          <div className="text-center mt-12 fade-in-up">
            <Link to="/projects" className="btn-primary inline-flex items-center">
              View All Projects
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <Statistics />

      {/* Testimonials Section */}
      <Testimonials />
    </div>
  )
}

export default Home
