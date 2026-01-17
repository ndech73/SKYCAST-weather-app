import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../utils/auth";
import "../styles/pages/intro.css";

function Intro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      try {
        // Check if user is authenticated using the simple utility
        const isAuth = authUtils.isAuthenticated();
        const userData = authUtils.getUserData();

        // Debug logging
        console.log("🔐 Authentication Check:");
        console.log("  - isAuthenticated:", isAuth);
        console.log("  - userId:", userData?.id);
        console.log("  - userEmail:", userData?.email);

        // Redirect after 2 seconds
        const timer = setTimeout(() => {
          if (isAuth) {
            // User is authenticated - go to home
            console.log("✅ User authenticated, redirecting to /home");
            navigate("/home", { replace: true });
          } else {
            // User is not authenticated - go to register
            console.log("❌ User not authenticated, redirecting to /register");
            navigate("/register", { replace: true });
          }
          setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);

      } catch (error) {
        console.error("❌ Auth check error:", error);
        
        const timer = setTimeout(() => {
          console.log("🚨 Error during auth check, redirecting to /register");
          navigate("/register", { replace: true });
          setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

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
    </div>
  );
}

export default Intro;