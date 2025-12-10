import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-dark-950 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-dark-800">
      <div className="container-custom py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          {/* About */}
          <div>
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">About Us</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              Nexus Engineering Partners is a premier engineering consulting firm delivering innovative solutions for infrastructure, construction, and development projects worldwide.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Home</Link></li>
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">About Us</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Services</Link></li>
              <li><Link to="/projects" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Projects</Link></li>
              <li><Link to="/team" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Our Team</Link></li>
              <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2.5">
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Structural Design</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Water Infrastructure</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Bridge Engineering</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Transportation Engineering</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Tender Management</Link></li>
              <li><Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">Project Management</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Nexus Engineering Partners<br />Business District, Dar es Salaam<br />Tanzania</span>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+255744690860" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">+255 744 690 860</a>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-3 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:support@nexusengineering.co.tz" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors text-sm">support@nexusengineering.co.tz</a>
              </li>
              <li className="flex items-center mt-4">
                <svg className="w-4 h-4 mr-3 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Mon-Fri: 8:00AM - 5:00PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-dark-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
              <Link to="/terms-of-service" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">Terms of Service</Link>
              <span className="text-gray-400 dark:text-gray-700">|</span>
              <Link to="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">Privacy Policy</Link>
              <span className="text-gray-400 dark:text-gray-700">|</span>
              <Link to="/community-guidelines" className="text-gray-600 dark:text-gray-400 hover:text-accent-500 transition-colors">Community Guidelines</Link>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">&copy; 2025 Nexus Engineering Partners. All rights reserved.</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">Delivering Engineering Excellence Worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
