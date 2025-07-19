// API Configuration - Handle different environments properly

const getApiConfig = () => {
  // Check if we're in development mode (localhost)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check if we're on the production domain
  const isDomain = window.location.hostname === 'graphykon.com' || window.location.hostname === 'www.graphykon.com';
  
  // Check if we're on the production IP
  const isProductionIP = window.location.hostname === '89.117.58.204';
  
  let baseURL, socketURL;
  
  if (isDomain) {
    // If on domain, use the same domain without port (Nginx will proxy)
    const protocol = window.location.protocol;
    baseURL = `${protocol}//${window.location.hostname}`;
    socketURL = `${protocol}//${window.location.hostname}`;
  } else if (isProductionIP) {
    // If on production IP, use the IP with port 5000
    baseURL = 'http://89.117.58.204:5000';
    socketURL = 'http://89.117.58.204:5000';
  } else if (isLocalhost) {
    // Only use localhost if actually running on localhost
    baseURL = 'http://localhost:5000';
    socketURL = 'http://localhost:5000';
  } else {
    // Default to production IP for any other case
    baseURL = 'http://89.117.58.204:5000';
    socketURL = 'http://89.117.58.204:5000';
  }
  
  console.log('API Config:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isLocalhost,
    isDomain,
    isProductionIP,
    baseURL,
    socketURL,
    environment: isLocalhost ? 'development' : 'production'
  });
  
  return {
    baseURL,
    socketURL,
    environment: isLocalhost ? 'development' : 'production',
    withCredentials: true
  };
};

export default getApiConfig; 