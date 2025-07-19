// API Configuration - Always use live server

const getApiConfig = () => {
  // Always use the live server
  const baseURL = 'http://89.117.58.204:5000';
  const socketURL = 'http://89.117.58.204:5000';
  
  console.log('API Config:', {
    hostname: window.location.hostname,
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