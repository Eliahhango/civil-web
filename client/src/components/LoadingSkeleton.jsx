const LoadingSkeleton = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-72 bg-gray-300"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (type === 'project') {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-64 bg-gray-300"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-300 rounded w-2/3 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-4/5 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  )
}

export default LoadingSkeleton

