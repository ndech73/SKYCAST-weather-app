import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../utils/auth.js";
import "../styles/pages/intro.css";

function Intro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authDebug, setAuthDebug] = useState(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Get detailed auth status for debugging
        const debugInfo = authUtils.getDetailedAuthStatus();
        setAuthDebug(debugInfo);

        // Debug: Log authentication state
        console.log("🔐 Auth Debug Info:", debugInfo);
        console.log("📝 LocalStorage Debug:");
        console.log("isAuthenticated:", localStorage.getItem("isAuthenticated"));
        console.log("authToken:", localStorage.getItem("authToken") ? "***" + localStorage.getItem("authToken").slice(-4) : "null");
        console.log("hasAccount:", localStorage.getItem("hasAccount"));
        console.log("tokenExpiry:", localStorage.getItem("tokenExpiry"));
        console.log("userId:", localStorage.getItem("userId"));

        // Determine redirect based on auth status
        const authStatus = authUtils.getAuthStatus();
        
        console.log("🔄 Determined Auth Status:", authStatus);
        
        // Add a small delay for better UX (showing the intro screen)
        const timer = setTimeout(() => {
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
        }, 2000); // Reduced to 2 seconds for better UX

        return () => clearTimeout(timer);

      } catch (error) {
        console.error("❌ Auth check error:", error);
        
        // Fallback: Redirect to register on error
        const timer = setTimeout(() => {
          console.log("🚨 Auth check failed, defaulting to /register");
          navigate("/register", { replace: true });
          setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  // Show debug info in development
  const showDebugInfo = process.env.NODE_ENV === 'development' && authDebug;

  return (
    <div className="intro-container">
      {/* Animated background elements */}
      <div className="floating-cloud"></div>
      <div className="floating-cloud"></div>
      <div className="floating-cloud"></div>
      
      {/* Main content */}
      <img 
        src="/Copilot_20251115_114124.png"
        alt="SkyCast Logo" 
        className={`intro-logo ${loading ? 'logo-visible' : 'logo-fade-out'}`}
        onError={(e) => {
          console.error('Failed to load logo image');
          e.target.style.display = 'none';
        }}
      />
      
      <h1 className={`intro-title ${loading ? 'title-visible' : 'title-fade-out'}`}>
        SkyCast
      </h1>
      
      {/* Loading animation */}
      {loading && (
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      {/* Debug info - only shown in development */}
      {showDebugInfo && (
        <div className="debug-info" style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          <strong>Auth Debug:</strong>
          <div>Status: {authDebug.status}</div>
          <div>Authenticated: {authDebug.isAuthenticated ? 'Yes' : 'No'}</div>
          <div>Has Account: {authDebug.hasAccount ? 'Yes' : 'No'}</div>
          <div>Token Expired: {authDebug.isExpired ? 'Yes' : 'No'}</div>
          <div>User ID: {authDebug.userId || 'None'}</div>
          {authDebug.error && <div>Error: {authDebug.error}</div>}
        </div>
      )}
    </div>
  );
}

export default Intro;