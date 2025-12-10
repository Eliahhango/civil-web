import { useState, useEffect } from 'react'

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      id: 1,
      name: 'Dr. Robert Kimani',
      position: 'Project Director, National Infrastructure Authority',
      company: 'Government Agency',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      text: 'Nexus Engineering Partners delivered exceptional results on our highway expansion project. Their technical expertise and attention to detail exceeded our expectations. The project was completed on time and within budget.',
      rating: 5
    },
    {
      id: 2,
      name: 'Sarah Mwangi',
      position: 'CEO, Urban Development Corp',
      company: 'Private Developer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      text: 'Working with Nexus was a game-changer for our commercial development. Their innovative structural solutions saved us significant costs while maintaining the highest safety standards. Highly professional team.',
      rating: 5
    },
    {
      id: 3,
      name: 'Eng. James Otieno',
      position: 'Infrastructure Manager',
      company: 'Regional Water Authority',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      text: 'The water treatment facility designed by Nexus Engineering Partners is operating flawlessly. Their comprehensive approach to water infrastructure engineering is unmatched. We\'ve seen significant improvements in efficiency.',
      rating: 5
    },
    {
      id: 4,
      name: 'Fatima Hassan',
      position: 'Construction Director',
      company: 'Mega Builders Ltd',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      text: 'Nexus Engineering Partners provided outstanding project management services. Their team\'s coordination and quality control ensured smooth execution throughout the construction phase. We look forward to future collaborations.',
      rating: 5
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white dark:from-dark-900 dark:to-dark-950">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">What Our Clients Say</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4">
            Don't just take our word for it. Here's what our clients have to say about working with Nexus Engineering Partners.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-500 to-accent-700"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover border-2 sm:border-4 border-gray-200 dark:border-dark-700 shadow-lg"
                />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start gap-1 mb-4">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 leading-relaxed italic">
                  "{currentTestimonial.text}"
                </p>
                
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-bold text-base sm:text-lg">{currentTestimonial.name}</p>
                  <p className="text-accent-600 font-semibold text-sm sm:text-base">{currentTestimonial.position}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{currentTestimonial.company}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-accent-600 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials

