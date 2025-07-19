import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import getApiConfig from '../../config/api';

const MessageTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [testUserId, setTestUserId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello test message');

  const addResult = (test, result) => {
    setTestResults(prev => ({
      ...prev,
      [test]: result
    }));
  };

  const testAPI = async (endpoint, options = {}) => {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        ...options
      });
      
      const data = await response.json();
      
      return {
        status: response.status,
        ok: response.ok,
        data: data
      };
    } catch (error) {
      return {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }
  };

  const runTest = async (testName, endpoint, options = {}) => {
    console.log(`Running test: ${testName}`);
    const result = await testAPI(endpoint, options);
    console.log(`Test result for ${testName}:`, result);
    addResult(testName, result);
    return result;
  };

  const runAllTests = async () => {
    console.log('Starting comprehensive message API tests...');
    
    // Test 1: Check authentication
    await runTest('AUTH_CHECK', '/api/auth/me');
    
    // Test 2: Get conversations
    await runTest('GET_CONVERSATIONS', '/api/messages/conversations');
    
    // Test 3: Get unread count
    await runTest('GET_UNREAD_COUNT', '/api/messages/unread-count');
    
    // Test 4: Search users
    await runTest('SEARCH_USERS', '/api/messages/search-users?query=test');
    
    // Test 5: Test send message (if testUserId is provided)
    if (testUserId) {
      await runTest('SEND_MESSAGE', '/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: testUserId,
          content: testMessage
        })
      });
    }
    
    toast.success('Tests completed! Check console for details.');
  };

  const testSocketConnection = () => {
    console.log('Testing socket connection...');
    
    const apiConfig = getApiConfig();
    const socket = new WebSocket(apiConfig.socketURL.replace('http', 'ws'));
    
    socket.onopen = () => {
      console.log('Socket connection opened');
      addResult('SOCKET_CONNECTION', { status: 'CONNECTED', ok: true });
    };
    
    socket.onerror = (error) => {
      console.error('Socket connection error:', error);
      addResult('SOCKET_CONNECTION', { status: 'ERROR', ok: false, error: error.message });
    };
    
    socket.onclose = () => {
      console.log('Socket connection closed');
    };
    
    // Close connection after 3 seconds
    setTimeout(() => {
      socket.close();
    }, 3000);
  };

  if (!user) {
    return (
      <div className="container mt-5">
        <h3>Please log in to test messaging functionality</h3>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Message System Test Page</h2>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5>Current User Info</h5>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5>Test Configuration</h5>
          <div className="mb-3">
            <label className="form-label">Test User ID (for send message test):</label>
            <input
              type="text"
              className="form-control"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Enter another user's ID to test sending messages"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Test Message:</label>
            <input
              type="text"
              className="form-control"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5>Test Actions</h5>
          <div className="d-flex gap-2 mb-3">
            <button className="btn btn-primary" onClick={runAllTests}>
              Run All API Tests
            </button>
            <button className="btn btn-secondary" onClick={testSocketConnection}>
              Test Socket Connection
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5>Test Results</h5>
          <div className="row">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="col-md-6 mb-3">
                <div className={`alert ${result.ok ? 'alert-success' : 'alert-danger'}`}>
                  <h6>{test}</h6>
                  <p><strong>Status:</strong> {result.status}</p>
                  <p><strong>OK:</strong> {result.ok ? 'Yes' : 'No'}</p>
                  {result.data && (
                    <details>
                      <summary>Response Data</summary>
                      <pre style={{ fontSize: '0.8em' }}>{JSON.stringify(result.data, null, 2)}</pre>
                    </details>
                  )}
                  {result.error && (
                    <p><strong>Error:</strong> {result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTest; 