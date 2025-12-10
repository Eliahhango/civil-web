const About = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-gray-900 dark:text-white section-padding overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
        <div className="container-custom relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            About <span className="text-gray-900 dark:text-white">Us</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-700 dark:text-white/90 max-w-3xl">
            Discover the story behind Nexus Engineering Partners and our unwavering commitment to engineering excellence.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none px-4 sm:px-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Our Story</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                Nexus Engineering Partners was founded with a vision to revolutionize engineering consulting through innovation, expertise, and unwavering commitment to excellence. Since our establishment, we have been at the forefront of delivering cutting-edge engineering solutions that shape the future of infrastructure.
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                With over 25 years of combined experience, our team has successfully completed hundreds of projects across diverse sectors including commercial construction, transportation infrastructure, water systems, and sustainable development. Our commitment to quality, innovation, and client satisfaction has established us as a trusted partner for both public and private sector clients worldwide.
              </p>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 mt-8 sm:mt-12 md:mt-16">Our Mission</h2>
              <p className="text-body text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                To deliver world-class engineering consulting services that drive sustainable development and infrastructure excellence. We are committed to providing innovative solutions that meet the highest standards of quality, safety, and environmental responsibility while creating lasting value for our clients and communities.
              </p>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 mt-8 sm:mt-12 md:mt-16">Our Vision</h2>
              <p className="text-body text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                To be recognized as the premier engineering consulting firm globally, known for our technical excellence, innovative methodologies, and transformative impact on infrastructure development. We envision a future where engineering excellence drives sustainable progress and improves lives.
              </p>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 mt-8 sm:mt-12 md:mt-16">Our Core Values</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="card p-4 sm:p-6 md:p-8 card-hover">
                  <div className="bg-gray-100 dark:bg-dark-800 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Excellence</h3>
                  <p className="text-body">
                    We pursue excellence in every project, ensuring the highest quality standards in all our deliverables and maintaining rigorous quality assurance processes.
                  </p>
                </div>
                <div className="card p-4 sm:p-6 md:p-8 card-hover">
                  <div className="bg-gray-100 dark:bg-dark-800 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Integrity</h3>
                  <p className="text-body">
                    We conduct our business with the utmost integrity, maintaining transparency, ethical practices, and accountability in all our professional relationships.
                  </p>
                </div>
                <div className="card p-4 sm:p-6 md:p-8 card-hover">
                  <div className="bg-gray-100 dark:bg-dark-800 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Innovation</h3>
                  <p className="text-body">
                    We embrace innovative solutions and cutting-edge technology to solve complex engineering challenges, continuously advancing our methodologies and capabilities.
                  </p>
                </div>
                <div className="card p-4 sm:p-6 md:p-8 card-hover">
                  <div className="bg-gray-100 dark:bg-dark-800 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Client Focus</h3>
                  <p className="text-body">
                    Our clients are at the heart of everything we do. We are committed to understanding their unique needs and exceeding their expectations through exceptional service.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 mt-8 sm:mt-12 md:mt-16">Certifications & Standards</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                Nexus Engineering Partners maintains all necessary professional certifications and licenses. We comply with international engineering standards including ISO 9001 quality management systems, and adhere to local and international building codes, safety regulations, and environmental standards. Our team members hold professional engineering licenses and continuously engage in professional development to stay current with industry best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-accent-600 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg border border-white/20">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">25+</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold">Years of Excellence</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg border border-white/20">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">200+</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold">Projects Completed</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg border border-white/20">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">60+</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold">Expert Engineers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg border border-white/20">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">24/7</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold">Client Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
