// Simple and reliable authentication utility functions

export const authUtils = {
  // Logout function - clears all auth data
  logout: (navigate) => {
    try {
      // Clear all authentication data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('hasAccount');
      
      console.log('🚪 User logged out successfully');
      
      // Redirect to intro page (so animation plays)
      if (navigate) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    try {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      return isAuth && userId && userEmail;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Get user data
  getUserData: () => {
    try {
      return {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        loginTime: localStorage.getItem('loginTime')
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Set authentication data (after login)
  setAuthentication: (userData) => {
    try {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.username || userData.name);
      localStorage.setItem('loginTime', new Date().toISOString());
      
      console.log('✅ Authentication data set successfully');
    } catch (error) {
      console.error('Error setting authentication:', error);
      throw error;
    }
  },

  // Clear all auth data
  clearAuthData: () => {
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('hasAccount');
      
      console.log('🧹 Authentication data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
};