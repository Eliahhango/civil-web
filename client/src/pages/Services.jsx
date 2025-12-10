import { useEffect, useState } from 'react'
import axiosInstance from '../utils/axios'
import { BuildingIcon, WaterIcon, BridgeIcon, RoadIcon, DocumentIcon, ChartIcon } from '../components/Icons'

const Services = () => {
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
    const fetchServices = async () => {
      try {
        const response = await axiosInstance.get('/services')
        setServices(response.data)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const serviceDetails = {
    1: {
      features: [
        'Advanced structural analysis and design',
        'Seismic and wind load calculations',
        'Reinforced concrete and steel structures',
        'Building information modeling (BIM)',
        'Code compliance and regulatory approval',
        'Retrofit and rehabilitation services',
        'Value engineering solutions',
        'Construction support and supervision'
      ]
    },
    2: {
      features: [
        'Water supply system design and optimization',
        'Wastewater treatment plant engineering',
        'Water distribution network analysis',
        'Pumping station design and automation',
        'Water quality monitoring systems',
        'Sustainable water resource management',
        'Infrastructure master planning',
        'Maintenance and operations consulting'
      ]
    },
    3: {
      features: [
        'Bridge structural design and analysis',
        'Load rating and capacity assessment',
        'Material specification and selection',
        'Construction engineering and inspection',
        'Bridge health monitoring systems',
        'Rehabilitation and strengthening',
        'Seismic retrofit design',
        'Long-term maintenance planning'
      ]
    },
    4: {
      features: [
        'Highway and roadway geometric design',
        'Traffic impact analysis and modeling',
        'Drainage and stormwater management',
        'Pavement design and evaluation',
        'Road safety audits and improvements',
        'Intelligent transportation systems',
        'Construction management',
        'Asset management and maintenance'
      ]
    },
    5: {
      features: [
        'Comprehensive tender document preparation',
        'Technical specification development',
        'Bid evaluation and assessment',
        'Contract administration support',
        'Procurement strategy development',
        'Vendor qualification and selection',
        'Compliance verification and auditing',
        'Documentation and record management'
      ]
    },
    6: {
      features: [
        'Integrated project management services',
        'Financial planning and cost control',
        'Quality assurance and quality control',
        'Construction supervision and monitoring',
        'Risk assessment and mitigation',
        'Schedule development and tracking',
        'Stakeholder coordination',
        'Project closeout and handover'
      ]
    }
  }

  if (loading) {
    return (
      <div className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-gray-900 dark:text-white section-padding overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
        <div className="container-custom relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Our <span className="text-gray-900 dark:text-white">Services</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-700 dark:text-white/90 max-w-3xl">
            Comprehensive engineering consulting services designed to deliver exceptional results for your most challenging projects.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon] || BuildingIcon
              return (
                <div
                  key={service.id}
                  className="card p-8 card-hover"
                >
                  <div className="flex items-start space-x-6">
                    <div className="bg-gray-100 dark:bg-dark-800 p-5 rounded-lg flex-shrink-0">
                      <IconComponent className="w-10 h-10 text-accent-500" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{service.title}</h2>
                      <p className="text-body mb-6">{service.description}</p>
                      {serviceDetails[service.id] && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Key Capabilities:</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {serviceDetails[service.id].features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="w-5 h-5 text-accent-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-body text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-accent-600 text-white">
        <div className="container-custom text-center">
          <h2 className="heading-medium text-white mb-4">Ready to Start Your Project?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Let's discuss how our engineering expertise can bring your vision to life with innovative solutions and proven methodologies.
          </p>
          <a href="/contact" className="btn-primary bg-white text-accent-700 hover:bg-gray-50">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  )
}

export default Services
