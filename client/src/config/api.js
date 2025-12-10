// API Configuration
// In development, uses relative paths which will be proxied by Vite
// In production, you can set VITE_API_BASE_URL environment variable
// If not set, defaults to '/api' for relative paths
const getApiBaseUrl = () => {
  // Check for explicit API URL
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // In production, check for production API URL
  if (import.meta.env.MODE === 'production' && import.meta.env.VITE_PROD_API_URL) {
    return import.meta.env.VITE_PROD_API_URL
  }
  
  // Default to relative path (works with proxy in dev, needs backend in prod)
  return '/api'
}

export const apiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export default apiConfig;

