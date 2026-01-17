import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/userProfileIcon.css';

const UserProfileIcon = () => {
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    location: '',
    avatar: '👤',
    avatarImage: null
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user profile from localStorage on mount
    loadUserProfile();

    // Listen for profile updates from Settings page
    const handleProfileUpdate = (event) => {
      console.log('Profile updated event received:', event.detail);
      setUserProfile(event.detail);
    };

    // Listen for storage changes (when saved in Settings)
    const handleStorageChange = (event) => {
      if (event.key === 'userProfile' || event.storageArea === localStorage) {
        console.log('Storage changed, reloading profile');
        loadUserProfile();
      }
    };

    // Add event listeners
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Poll localStorage every 500ms to catch changes (fallback mechanism)
    const pollInterval = setInterval(() => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        // Only update if there's an actual change
        if (JSON.stringify(parsed) !== JSON.stringify(userProfile)) {
          console.log('Profile changed detected via polling');
          setUserProfile(parsed);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [userProfile]); // Include userProfile in dependency array

  const loadUserProfile = () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        console.log('Loaded profile from localStorage:', parsed);
        setUserProfile(parsed);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleIconClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('weatherAppSettings');
      setUserProfile({
        name: '',
        email: '',
        location: '',
        avatar: '👤',
        avatarImage: null
      });
      setShowDropdown(false);
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-profile-icon-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="user-profile-icon-container">
      <button 
        className="user-profile-icon-button"
        onClick={handleIconClick}
        title={userProfile.name || 'User Profile'}
      >
        {userProfile.avatarImage ? (
          <img 
            src={userProfile.avatarImage} 
            alt="Profile" 
            className="user-profile-image"
          />
        ) : (
          <span className="user-profile-emoji">{userProfile.avatar}</span>
        )}
      </button>

      {showDropdown && (
        <div className="user-profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {userProfile.avatarImage ? (
                <img 
                  src={userProfile.avatarImage} 
                  alt="Profile" 
                  className="dropdown-avatar-image"
                />
              ) : (
                <span className="dropdown-avatar-emoji">{userProfile.avatar}</span>
              )}
            </div>
            <div className="dropdown-info">
              <h4>{userProfile.name || 'Guest User'}</h4>
              <p>{userProfile.email || 'No email set'}</p>
              {userProfile.location && (
                <p className="user-location">📍 {userProfile.location}</p>
              )}
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-menu">
            <button 
              className="dropdown-item"
              onClick={handleSettingsClick}
            >
              <span className="dropdown-icon">⚙️</span>
              <span>Settings</span>
            </button>

            <button 
              className="dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                navigate('/history');
              }}
            >
              <span className="dropdown-icon">📊</span>
              <span>Weather History</span>
            </button>

            <button 
              className="dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                navigate('/favorites');
              }}
            >
              <span className="dropdown-icon">⭐</span>
              <span>Favorite Locations</span>
            </button>
          </div>

          <div className="dropdown-divider"></div>

          <button 
            className="dropdown-item logout"
            onClick={handleLogout}
          >
            <span className="dropdown-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileIcon;