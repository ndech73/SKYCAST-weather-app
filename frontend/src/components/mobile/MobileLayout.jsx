import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  IoHomeOutline, 
  IoHome,
  IoStarOutline, 
  IoStar,
  IoStatsChartOutline,
  IoStatsChart,
  IoMapOutline,
  IoMap,
  IoSettingsOutline,
  IoSettings,
  IoNotificationsOutline,
  IoSearchOutline
} from 'react-icons/io5';
import { WiDaySunny } from 'react-icons/wi';
import '../../styles/pages/mobile-redesign.css';

const MobileLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const path = location.pathname;
    const page = searchParams.get('page');
    
    if (path === '/home') setCurrentPage('home');
    else if (page === 'overview') setCurrentPage('overview');
    else if (page === 'radar') setCurrentPage('radar');
    else if (page === 'favorites') setCurrentPage('favorites');
    else if (page === 'history') setCurrentPage('history');
    else if (page === 'settings') setCurrentPage('settings');
  }, [location, searchParams]);

  const handleNavigation = (page) => {
    setCurrentPage(page);
    if (page === 'home') {
      navigate('/home');
    } else {
      navigate(`/dashboard?page=${page}`);
    }
  };

  return (
    <div className="mobile-app-container">
      {/* Top Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <WiDaySunny className="mobile-logo-icon" />
            <span className="mobile-logo-text">SkyCast</span>
          </div>
          <div className="mobile-header-actions">
            <button className="mobile-icon-btn" aria-label="Notifications">
              <IoNotificationsOutline />
            </button>
            <button className="mobile-icon-btn" onClick={() => handleNavigation('settings')} aria-label="Settings">
              <IoSettingsOutline />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigation('home')}
          aria-label="Home"
        >
          <span className="mobile-nav-icon">
            {currentPage === 'home' ? <IoHome /> : <IoHomeOutline />}
          </span>
          <span className="mobile-nav-label">Home</span>
        </button>

        <button
          className={`mobile-nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
          onClick={() => handleNavigation('favorites')}
          aria-label="Favorites"
        >
          <span className="mobile-nav-icon">
            {currentPage === 'favorites' ? <IoStar /> : <IoStarOutline />}
          </span>
          <span className="mobile-nav-label">Favorites</span>
        </button>

        <button
          className={`mobile-nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => handleNavigation('history')}
          aria-label="History"
        >
          <span className="mobile-nav-icon">
            {currentPage === 'history' ? <IoStatsChart /> : <IoStatsChartOutline />}
          </span>
          <span className="mobile-nav-label">History</span>
        </button>

        <button
          className={`mobile-nav-item ${currentPage === 'radar' ? 'active' : ''}`}
          onClick={() => handleNavigation('radar')}
          aria-label="Radar"
        >
          <span className="mobile-nav-icon">
            {currentPage === 'radar' ? <IoMap /> : <IoMapOutline />}
          </span>
          <span className="mobile-nav-label">Radar</span>
        </button>

        <button
          className={`mobile-nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavigation('settings')}
          aria-label="Settings"
        >
          <span className="mobile-nav-icon">
            {currentPage === 'settings' ? <IoSettings /> : <IoSettingsOutline />}
          </span>
          <span className="mobile-nav-label">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;