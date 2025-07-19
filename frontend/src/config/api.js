// API Configuration for different environments

const getApiConfig = () => {
  // Check if we're in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Get base URL based on environment
  let baseURL;
  let socketURL;
  
  if (isDevelopment) {
    // Local development
    baseURL = 'http://localhost:5000';
    socketURL = 'http://localhost:5000';
  } else {
    // Production deployment (any domain or IP)
    // Use the same domain/port as frontend
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    baseURL = `${protocol}//${hostname}:5000`;
    socketURL = `${protocol}//${hostname}:5000`;
  }
  
  console.log('API Config:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    baseURL,
    socketURL,
    environment: isDevelopment ? 'development' : 'production'
  });
  
  return {
    baseURL,
    socketURL,
    environment: isDevelopment ? 'development' : 'production',
    withCredentials: true
  };
};

export default getApiConfig; 