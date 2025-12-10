import LazyImage from './LazyImage'

// Component to display project images with fallback and lazy loading
const ProjectImage = ({ project, className = "" }) => {
  // Using Unsplash for high-quality engineering/construction images
  const imageMap = {
    1: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop', // Modern building
    2: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', // Highway
    3: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop', // Water facility
    4: 'https://images.unsplash.com/photo-1504307651254-35680f183b10?w=800&h=600&fit=crop', // Bridge
    5: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop', // Construction
    6: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop', // Infrastructure
    7: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', // Coastal bridge
    8: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop', // Smart city
    9: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', // Residential
    10: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop', // Wastewater
    11: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop', // Airport
    12: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=600&fit=crop', // Hydroelectric
    13: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', // Shopping mall
    14: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop', // Port
    15: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop', // Hospital
    16: 'https://images.unsplash.com/photo-1504307651254-35680f183b10?w=800&h=600&fit=crop', // Rural roads
    17: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', // Water network
    18: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop', // Stadium
  }

  const getImageUrl = () => {
    // If project has a direct image URL, use it
    if (project.image && project.image.startsWith('http')) {
      return project.image
    }
    // Use project ID to get consistent image from map
    return imageMap[project.id] || imageMap[1] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'

  return (
    <LazyImage
      src={getImageUrl()}
      alt={project.title || 'Project Image'}
      className={className}
      fallback={fallbackImage}
    />
  )
}

export default ProjectImage
