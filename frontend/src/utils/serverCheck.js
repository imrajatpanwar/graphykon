import getApiConfig from '../config/api';

export const checkServerStatus = async () => {
  const apiConfig = getApiConfig();
  
  console.log('🔍 Checking Server Status...');
  console.log('Current environment:', apiConfig.environment);
  console.log('API Base URL:', apiConfig.baseURL);
  console.log('Socket URL:', apiConfig.socketURL);
  console.log('Current hostname:', window.location.hostname);
  console.log('Current protocol:', window.location.protocol);
  
  try {
    // Test basic API endpoint
    const response = await fetch(`${apiConfig.baseURL}/api`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is responding:', data);
      return { status: 'online', data };
    } else {
      console.error('❌ Server responded with error:', response.status);
      return { status: 'error', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.log('📋 Connection refused - server might not be running');
    } else if (error.message.includes('ERR_NETWORK')) {
      console.log('📋 Network error - check internet connection');
    }
    
    return { status: 'offline', error: error.message };
  }
};

export const checkServerHealth = async () => {
  const apiConfig = getApiConfig();
  
  try {
    const response = await fetch(`${apiConfig.baseURL}/api/health`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const health = await response.json();
      console.log('🏥 Server Health Check:', health);
      return health;
    } else {
      console.error('❌ Health check failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return null;
  }
};

export const debugConnectionIssues = async () => {
  console.log('🔧 Starting Connection Debug...');
  
  const serverStatus = await checkServerStatus();
  const serverHealth = await checkServerHealth();
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    serverStatus,
    serverHealth,
    environment: getApiConfig(),
    browser: {
      userAgent: navigator.userAgent,
      location: window.location.href
    }
  };
  
  console.log('🐛 Debug Information:', debugInfo);
  
  // Provide recommendations
  if (serverStatus.status === 'offline') {
    console.log('🔧 Recommendations:');
    console.log('1. Check if backend server is running');
    console.log('2. Verify server is accessible at:', getApiConfig().baseURL);
    console.log('3. Check firewall settings');
    console.log('4. Verify MongoDB is connected');
  }
  
  return debugInfo;
}; 