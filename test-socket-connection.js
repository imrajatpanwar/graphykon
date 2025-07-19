const io = require('socket.io-client');

// Test Socket.IO connection
async function testSocketConnection() {
  console.log('🔍 Testing Socket.IO connection...');
  
  // Test both domain and direct IP
  const testUrls = [
    'https://graphykon.com',
    'http://89.117.58.204:5000'
  ];
  
  for (const url of testUrls) {
    console.log(`\n📡 Testing connection to: ${url}`);
    
    try {
      const socket = io(url, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true
      });
      
      // Set up event handlers
      socket.on('connect', () => {
        console.log(`✅ Connected to ${url} - Socket ID: ${socket.id}`);
        console.log(`🔗 Transport: ${socket.io.engine.transport.name}`);
      });
      
      socket.on('connect_error', (error) => {
        console.error(`❌ Connection error to ${url}:`, error.message);
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected from ${url}: ${reason}`);
      });
      
      // Test visitor join event
      socket.on('connect', () => {
        console.log('📊 Testing visitor-join event...');
        socket.emit('visitor-join', {
          userId: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          currentPage: '/test'
        });
      });
      
      // Wait for connection or timeout
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Timeout waiting for connection to ${url}`);
          socket.disconnect();
          resolve();
        }, 10000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          setTimeout(() => {
            socket.disconnect();
            resolve();
          }, 2000);
        });
        
        socket.on('connect_error', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }
  
  console.log('\n🏁 Socket.IO connection test completed');
}

// Run the test
testSocketConnection().catch(console.error); 