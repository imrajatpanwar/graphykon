import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Run from './components/Run';
import Header from './components/Header';
import BeACreator from './components/BeACreator';
import CreatorDashboard from './components/CreatorDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/run" element={<Run />} />
            <Route path="/be-a-creator" element={
              <PrivateRoute>
                <BeACreator />
              </PrivateRoute>
            } />
            <Route path="/creator-dashboard" element={
              <PrivateRoute>
                <CreatorDashboard />
              </PrivateRoute>
            } />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 