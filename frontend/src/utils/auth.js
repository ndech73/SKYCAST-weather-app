// Authentication utility functions
export const authUtils = {
  // Check if user has a valid authentication token
  hasValidToken: () => {
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
      if (now > parseInt(tokenExpiry)) {
        // Token expired, clear auth data
        this.clearAuthData();
        return false;
      }
    }
    
    return true;
  },
  
  // Check if user has ever created an account
  hasCreatedAccount: () => {
    return localStorage.getItem("hasAccount") === "true";
  },
  
  // Get user's authentication status
  getAuthStatus: () => {
    if (this.hasValidToken()) {
      return 'authenticated';
    } else if (this.hasCreatedAccount()) {
      return 'has-account';
    } else {
      return 'new-user';
    }
  },
  
  // Clear authentication data (on logout or token expiry)
  clearAuthData: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId");
    // Note: We DON'T remove hasAccount so we know user exists
  },
  
  // Initialize auth data (call this after successful registration)
  markAccountCreated: () => {
    localStorage.setItem("hasAccount", "true");
  },
  
  // Set authentication data (call this after successful login)
  setAuthentication: (token, userId, expiresInHours = 24) => {
    const expiryTime = Date.now() + (expiresInHours * 60 * 60 * 1000);
    
    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("tokenExpiry", expiryTime.toString());
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("hasAccount", "true"); // Also mark as having account
  },
  
  // Get current user ID
  getUserId: () => {
    return localStorage.getItem("userId");
  },
  
  // Get auth token for API calls
  getToken: () => {
    return localStorage.getItem("authToken");
  },
  
  // Check if token is expired
  isTokenExpired: () => {
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (!tokenExpiry) return true;
    
    return Date.now() > parseInt(tokenExpiry);
  }
};