// API Configuration - Handle domain and IP properly

const getApiConfig = () => {
  // Check if we're on the domain or IP
  const isDomain = window.location.hostname === 'graphykon.com' || window.location.hostname === 'www.graphykon.com';
  const isIP = window.location.hostname === '89.117.58.204';
  
  let baseURL, socketURL;
  
  if (isDomain) {
    // If on domain, use the same domain without port (Nginx will proxy)
    const protocol = window.location.protocol;
    baseURL = `${protocol}//${window.location.hostname}`;
    socketURL = `${protocol}//${window.location.hostname}`;
  } else {
    // If on IP or localhost, use the IP directly
    baseURL = 'http://89.117.58.204:5000';
    socketURL = 'http://89.117.58.204:5000';
  }
  
  console.log('API Config:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isDomain,
    isIP,
    baseURL,
    socketURL,
    environment: 'production'
  });
  
  return {
    baseURL,
    socketURL,
    environment: 'production',
    withCredentials: true
  };
};

export default getApiConfig; 