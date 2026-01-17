import React from 'react';
import OverviewPage from './OverviewPage';
import RadarPage from './RadarPage';
import HistoryPage from './HistoryPage';
import OutfitsPage from './OutfitsPage';
import FavoritesPage from './FavoritesPage';
import SettingsPage from './SettingsPage';
import UserProfileIcon from '../../pages/userProfileIcon';
import '../../styles/pages/DashboardContent.css';

const DashboardContent = ({ currentPage, sidebarCollapsed }) => {
  const renderContent = () => {
    switch(currentPage) {
      case 'overview': return <OverviewPage />;
      case 'radar': return <RadarPage />;
      case 'history': return <HistoryPage />;
      case 'outfits': return <OutfitsPage />;
      case 'favorites': return <FavoritesPage />;
      case 'settings': return <SettingsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className={`dashboard-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="content-header">
        <h1>{getPageTitle(currentPage)}</h1>
        <div className="header-actions">
          <button className="action-btn">🔔</button>
          <UserProfileIcon />
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

const getPageTitle = (page) => {
  const titles = {
    overview: 'Weather Overview',
    radar: 'Interactive Radar',
    history: 'Weather History & Trends',
    outfits: 'AI Outfit Recommender',
    favorites: 'Favorite Locations',
    settings: 'Settings'
  };
  return titles[page] || 'Dashboard';
};

export default DashboardContent;
