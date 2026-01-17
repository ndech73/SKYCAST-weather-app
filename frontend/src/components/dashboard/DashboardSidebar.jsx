import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import '../../styles/pages/dashboardsidebar.css';

const DashboardSidebar = ({ currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Weather Overview' },
    { id: 'radar', icon: '🛰', label: 'Radar Map' },
    { id: 'history', icon: '📈', label: 'Weather History' },
    { id: 'outfits', icon: '👕', label: 'Outfit Recommender' },
    { id: 'favorites', icon: '⭐', label: 'Favorite Locations' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'logout', icon: '🚪', label: 'Logout' }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear weather app specific data
    localStorage.removeItem('weatherFavorites');
    localStorage.removeItem('weatherAppSettings');
    localStorage.removeItem('userProfile');
    
    // Use authUtils to clear authentication and redirect
    authUtils.logout(navigate);
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleSettings = () => {
    setCurrentPage('settings');
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const sidebarClasses = `dashboard-sidebar ${sidebarCollapsed && !isMobile ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`;

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      {isMobile && (
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          title={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      )}
      
      {/* Sidebar */}
      <div className={sidebarClasses}>
        <div className="sidebar-header">
          {/* Only show toggle button on desktop */}
          {!isMobile && (
            <button 
              className="toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              ☰
            </button>
          )}
          
          {/* Show title on desktop (when not collapsed) OR on mobile when menu is open */}
          {((!sidebarCollapsed && !isMobile) || isMobile) && (
            <h2 
              className="sidebar-title"
              onClick={() => navigate('/home')}
              style={{ cursor: 'pointer' }}
            >
              SkyCast
            </h2>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            item.id === 'logout' ? (
              <button
                key={item.id}
                className="nav-btn logout-btn"
                onClick={handleLogoutClick}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {((!sidebarCollapsed && !isMobile) || isMobile) && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            ) : item.id === 'settings' ? (
              <button
                key={item.id}
                className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
                onClick={handleSettings}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {((!sidebarCollapsed && !isMobile) || isMobile) && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            ) : (
              <button
                key={item.id}
                className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {((!sidebarCollapsed && !isMobile) || isMobile) && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            )
          ))}
        </nav>
      </div>
      
      {/* Overlay for mobile when menu is open */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-icon">🚪</div>
            <h3 className="logout-modal-title">Confirm Logout</h3>
            <p className="logout-modal-message">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>
            <div className="logout-modal-actions">
              <button 
                className="logout-modal-btn cancel-btn"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button 
                className="logout-modal-btn confirm-btn"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;