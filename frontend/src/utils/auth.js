// Authentication utility functions with comprehensive error handling
export const authUtils = {
  // Check if user has a valid authentication token
  hasValidToken: () => {
    try {
      const token = localStorage.getItem("authToken");
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      
      // No token or not authenticated
      if (!token || isAuthenticated !== "true") {
        return false;
      }
      
      // Check token expiration
      if (tokenExpiry) {
        const now = Date.now();
        const expiryTime = parseInt(tokenExpiry);
        
        // Validate expiry time is a valid number
        if (isNaN(expiryTime)) {
          console.warn('Invalid token expiry time, clearing auth data');
          authUtils.clearAuthData();
          return false;
        }
        
        if (now > expiryTime) {
          // Token expired, clear auth data
          authUtils.clearAuthData();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  },
  
  // Check if user has ever created an account
  hasCreatedAccount: () => {
    try {
      return localStorage.getItem("hasAccount") === "true";
    } catch (error) {
      console.error('Error checking account creation status:', error);
      return false;
    }
  },
  
  // Get user's authentication status
  getAuthStatus: () => {
    try {
      if (authUtils.hasValidToken()) {
        return 'authenticated';
      } else if (authUtils.hasCreatedAccount()) {
        return 'has-account';
      } else {
        return 'new-user';
      }
    } catch (error) {
      console.error('Error getting auth status:', error);
      return 'new-user'; // Default to new user on error
    }
  },
  
  // Clear authentication data (on logout or token expiry)
  clearAuthData: () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userId");
      // Note: We DON'T remove hasAccount so we know user exists
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },
  
  // Initialize auth data (call this after successful registration)
  markAccountCreated: () => {
    try {
      localStorage.setItem("hasAccount", "true");
      console.log('Account creation marked successfully');
    } catch (error) {
      console.error('Error marking account creation:', error);
      throw new Error('Failed to save account status');
    }
  },
  
  // Set authentication data (call this after successful login)
  setAuthentication: (token, userId, expiresInHours = 24) => {
    try {
      // Validate inputs
      if (!token || !userId) {
        throw new Error('Token and userId are required');
      }
      
      if (typeof expiresInHours !== 'number' || expiresInHours <= 0) {
        throw new Error('expiresInHours must be a positive number');
      }
      
      const expiryTime = Date.now() + (expiresInHours * 60 * 60 * 1000);
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("tokenExpiry", expiryTime.toString());
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("hasAccount", "true"); // Also mark as having account
      
      console.log('Authentication data set successfully for user:', userId);
    } catch (error) {
      console.error('Error setting authentication data:', error);
      throw new Error('Failed to set authentication data: ' + error.message);
    }
  },
  
  // Get current user ID
  getUserId: () => {
    try {
      return localStorage.getItem("userId");
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },
  
  // Get auth token for API calls
  getToken: () => {
    try {
      return localStorage.getItem("authToken");
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },
  
  // Check if token is expired
  isTokenExpired: () => {
    try {
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      if (!tokenExpiry) return true;
      
      const expiryTime = parseInt(tokenExpiry);
      if (isNaN(expiryTime)) return true;
      
      return Date.now() > expiryTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  },
  
  // Get remaining token lifetime in milliseconds
  getTokenLifetime: () => {
    try {
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      if (!tokenExpiry) return 0;
      
      const expiryTime = parseInt(tokenExpiry);
      if (isNaN(expiryTime)) return 0;
      
      const remaining = expiryTime - Date.now();
      return Math.max(0, remaining); // Return 0 if negative
    } catch (error) {
      console.error('Error calculating token lifetime:', error);
      return 0;
    }
  },
  
  // Validate token format (basic validation)
  validateTokenFormat: (token) => {
    try {
      if (!token || typeof token !== 'string') return false;
      if (token.length < 10) return false; // Basic length check
      
      // Add any additional token format validation here
      return true;
    } catch (error) {
      console.error('Error validating token format:', error);
      return false;
    }
  },
  
  // Safe authentication check with detailed status
  getDetailedAuthStatus: () => {
    try {
      const token = authUtils.getToken();
      const hasAccount = authUtils.hasCreatedAccount();
      const isExpired = authUtils.isTokenExpired();
      const hasToken = !!token;
      const isValidToken = authUtils.hasValidToken();
      
      return {
        isAuthenticated: isValidToken,
        hasAccount,
        hasToken,
        isExpired,
        tokenLifetime: authUtils.getTokenLifetime(),
        userId: authUtils.getUserId(),
        status: authUtils.getAuthStatus()
      };
    } catch (error) {
      console.error('Error getting detailed auth status:', error);
      return {
        isAuthenticated: false,
        hasAccount: false,
        hasToken: false,
        isExpired: true,
        tokenLifetime: 0,
        userId: null,
        status: 'new-user',
        error: error.message
      };
    }
  }
};