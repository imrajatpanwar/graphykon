// API Configuration for different environments

const getApiConfig = () => {
  // Check if we're in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check if we're running on the server
  const isServerEnvironment = window.location.hostname === '89.117.58.204';
  
  // Get base URL based on environment
  let baseURL;
  let socketURL;
  
  if (isDevelopment) {
    // Local development
    baseURL = 'http://localhost:5000';
    socketURL = 'http://localhost:5000';
  } else if (isServerEnvironment) {
    // Running on server
    baseURL = 'http://89.117.58.204:5000';
    socketURL = 'http://89.117.58.204:5000';
  } else {
    // Production deployment (could be any domain)
    // Try to use the same domain/port as frontend
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    baseURL = `${protocol}//${hostname}:5000`;
    socketURL = `${protocol}//${hostname}:5000`;
  }
  
  return {
    baseURL,
    socketURL,
    environment: isDevelopment ? 'development' : 'production',
    withCredentials: true
  };
};

export default getApiConfig; 