import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchTerm)
    } else {
      // Default: navigate to projects with search
      navigate(`/projects?search=${encodeURIComponent(searchTerm)}`)
    }
    setSearchTerm('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search projects, services..."
        className="w-full px-4 py-3 pl-12 pr-4 bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-700 rounded-lg focus:border-accent-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100"
      />
      <button
        type="submit"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-accent-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  )
}

export default SearchBar

