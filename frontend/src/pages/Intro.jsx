import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/intro.css";

function Intro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Authentication utility functions
  const authUtils = {
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
      // Note: We DON'T remove hasAccount so we know user exists
    },
    
    // Initialize auth data (call this after successful registration)
    markAccountCreated: () => {
      localStorage.setItem("hasAccount", "true");
    },
    
    // Set authentication data (call this after successful login)
    setAuthentication: (token, expiresInHours = 24) => {
      const expiryTime = Date.now() + (expiresInHours * 60 * 60 * 1000);
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("tokenExpiry", expiryTime.toString());
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("hasAccount", "true"); // Also mark as having account
    }
  };

  useEffect(() => {
    // Debug: Check what's in localStorage
    console.log("🔐 Auth Debug Info:");
    console.log("isAuthenticated:", localStorage.getItem("isAuthenticated"));
    console.log("authToken:", localStorage.getItem("authToken"));
    console.log("hasAccount:", localStorage.getItem("hasAccount"));
    console.log("tokenExpiry:", localStorage.getItem("tokenExpiry"));
    
    const timer = setTimeout(() => {
      const authStatus = authUtils.getAuthStatus();
      
      console.log("🔄 Determined Auth Status:", authStatus);
      
      switch (authStatus) {
        case 'authenticated':
          console.log("✅ User is authenticated, redirecting to /home");
          navigate("/home", { replace: true });
          break;
          
        case 'has-account':
          console.log("🔐 User has account but not logged in, redirecting to /login");
          navigate("/login", { replace: true });
          break;
          
        case 'new-user':
          console.log("👤 New user detected, redirecting to /register");
          navigate("/register", { replace: true });
          break;
          
        default:
          console.log("❓ Unknown auth status, defaulting to /register");
          navigate("/register", { replace: true });
          break;
      }
      
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="intro-container">
      <div className="floating-cloud"></div>
      <div className="floating-cloud"></div>
      <div className="floating-cloud"></div>
      
      <img 
        src="/Copilot_20251115_114124.png"
        alt="SkyCast Logo" 
        className={`intro-logo ${loading ? 'logo-visible' : 'logo-fade-out'}`}
      />
      <h1 className={`intro-title ${loading ? 'title-visible' : 'title-fade-out'}`}>
        SkyCast
      </h1>
      {loading && (
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}

export default Intro;
