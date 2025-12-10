const Statistics = () => {
  const stats = [
    {
      number: '200+',
      label: 'Projects Completed',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    },
    {
      number: '60+',
      label: 'Expert Engineers',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    },
    {
      number: '25+',
      label: 'Years Experience',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    },
    {
      number: '98%',
      label: 'Client Satisfaction',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    },
    {
      number: '50+',
      label: 'Awards & Recognition',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    },
    {
      number: '15+',
      label: 'Countries Served',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-accent-500 to-accent-600'
    }
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-dark-900 dark:to-dark-950">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Our <span className="text-gradient">Achievements</span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto font-medium px-4">
            Numbers that reflect our commitment to excellence and the trust our clients place in us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const vibrantGradients = [
              'from-accent-400 via-accent-500 to-accent-600',
              'from-accent-500 via-accent-600 to-accent-700',
              'from-accent-400 via-accent-500 to-accent-600',
              'from-accent-500 via-accent-600 to-accent-700',
              'from-accent-400 via-accent-500 to-accent-600',
              'from-accent-500 via-accent-600 to-accent-700'
            ]
            const gradient = vibrantGradients[index % vibrantGradients.length]
            return (
              <div
                key={index}
                className="bg-white dark:bg-dark-900/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 border-2 border-transparent hover:border-accent-300 dark:hover:border-accent-600 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`bg-gradient-to-br ${gradient} w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl`}>
                  {stat.icon}
                </div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 dark:from-gray-100 via-accent-700 to-accent-800 dark:via-accent-500 dark:to-accent-600 bg-clip-text text-transparent mb-2 group-hover:from-accent-600 group-hover:via-accent-700 group-hover:to-accent-800 transition-all">{stat.number}</div>
                <div className="text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base md:text-lg">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Statistics

