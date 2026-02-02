import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/userProfileIcon.css';

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  location: '',
  avatar: '👤',
  avatarImage: null
};

const safeParseProfile = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return null;
  }
};

const loadProfileFromStorage = () => {
  const raw = localStorage.getItem('userProfile');
  if (!raw) return DEFAULT_PROFILE;
  return safeParseProfile(raw) || DEFAULT_PROFILE;
};

const UserProfileIcon = () => {
  // Initialize from localStorage ONCE (prevents render loops)
  const [userProfile, setUserProfile] = useState(loadProfileFromStorage);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  // Used to avoid unnecessary state updates (and to remove polling)
  const currentProfileString = useMemo(() => JSON.stringify(userProfile), [userProfile]);

  useEffect(() => {
    // Listen for profile updates from Settings page
    const handleProfileUpdate = (event) => {
      const next = event?.detail ? { ...DEFAULT_PROFILE, ...event.detail } : null;
      if (!next) return;

      const nextString = JSON.stringify(next);
      if (nextString !== currentProfileString) {
        setUserProfile(next);
      }
    };

    // Listen for storage changes (only fires for OTHER tabs/windows)
    const handleStorageChange = (event) => {
      if (event.key !== 'userProfile') return;

      const next = event.newValue ? safeParseProfile(event.newValue) : DEFAULT_PROFILE;
      if (!next) return;

      const nextString = JSON.stringify(next);
      if (nextString !== currentProfileString) {
        setUserProfile(next);
      }
    };

    // Listen for logout broadcast (optional, matches your other components)
    const handleLoggedOut = () => {
      setUserProfile(DEFAULT_PROFILE);
      setShowDropdown(false);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedOut', handleLoggedOut);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedOut', handleLoggedOut);
    };
    // IMPORTANT: do NOT depend on userProfile directly (avoids maximum update depth)
  }, [currentProfileString]);

  const handleIconClick = () => {
    setShowDropdown((v) => !v);
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('weatherAppSettings');

      setUserProfile(DEFAULT_PROFILE);
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
            <button className="dropdown-item" onClick={handleSettingsClick}>
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

          <button className="dropdown-item logout" onClick={handleLogout}>
            <span className="dropdown-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileIcon;