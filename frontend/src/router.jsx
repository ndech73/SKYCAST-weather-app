import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Intro from './pages/Intro';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MobileLayout from './components/mobile/MobileLayout';
import MobileWeatherHome from './components/mobile/MobileWeatherHome';
import MobileSettings from './components/mobile/MobileSettings';
import MobileFavorites from './components/mobile/MobileFavorites';
import MobileHistory from './components/mobile/MobileHistory';
import MobileRadar from './components/mobile/MobileRadar';

// Mobile Dashboard Router
const MobileDashboard = () => {
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || 'overview';

  return (
    <MobileLayout>
      {page === 'overview' && <MobileWeatherHome />}
      {page === 'settings' && <MobileSettings />}
      {page === 'favorites' && <MobileFavorites />}
      {page === 'history' && <MobileHistory />}
      {page === 'radar' && <MobileRadar />}
    </MobileLayout>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Intro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              {isMobile ? (
                <MobileLayout>
                  <MobileWeatherHome />
                </MobileLayout>
              ) : (
                <Home />
              )}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {isMobile ? <MobileDashboard /> : <Dashboard />}
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;