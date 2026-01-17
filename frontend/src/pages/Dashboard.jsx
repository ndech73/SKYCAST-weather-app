import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardContent from '../components/dashboard/DashboardContent';
import '../styles/pages/dashboard.css';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-container">
      <DashboardSidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <DashboardContent 
        currentPage={currentPage} 
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
};

export default Dashboard;