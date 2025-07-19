import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debugConnectionIssues } from './utils/serverCheck';
import Navbar from './components/common/Navbar';
import Home from './components/common/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Creator from './components/creator/Creator';
import CreatorDashboard from './components/creator/CreatorDashboard';
import CreatorPublicProfile from './components/creator/CreatorPublicProfile';
import AssetDetail from './components/assets/AssetDetail';
import SearchResults from './components/common/SearchResults';
import AdminDashboard from './components/admin/AdminDashboard';
import Pricing from './components/pricing/Pricing';
import Messages from './components/messages/Messages';
import MessageTest from './components/messages/MessageTest';
import { AuthProvider } from './context/AuthContext';

function App() {
  // Debug server connection on app startup
  useEffect(() => {
    const runDebug = async () => {
      try {
        await debugConnectionIssues();
      } catch (error) {
        console.error('Debug check failed:', error);
      }
    };
    
    runDebug();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={
              <div>
                <Home />
              </div>
            } />
            <Route path="/login" element={
              <div>
                <Login />
              </div>
            } />
            <Route path="/signup" element={
              <div>
                <Signup />
              </div>
            } />
            <Route path="/creator" element={
              <div>
                <Creator />
              </div>
            } />
            <Route path="/creator-dashboard" element={<CreatorDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/message-test" element={<MessageTest />} />
            <Route path="/search" element={
              <div>
                <SearchResults />
              </div>
            } />
            <Route path="/assets/:id" element={
              <div>
                <AssetDetail />
              </div>
            } />
            <Route path="/asset/:id" element={
              <div>
                <AssetDetail />
              </div>
            } />
            <Route path="/:username" element={<CreatorPublicProfile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
