import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/pages/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  // Enhanced password validation with special characters
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noSpaces: !/\s/.test(password),
      maxLength: password.length <= 100
    };

    return requirements;
  };

  // Input validation
  const validateInputs = (email, password) => {
    const errors = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Please enter a valid email address");
    }

    // Enhanced password validation
    const passwordRequirements = validatePassword(password);
    
    if (!passwordRequirements.minLength) {
      errors.push("Password must be at least 8 characters long");
    } else if (!passwordRequirements.hasUpperCase) {
      errors.push("Password must contain at least one uppercase letter");
    } else if (!passwordRequirements.hasLowerCase) {
      errors.push("Password must contain at least one lowercase letter");
    } else if (!passwordRequirements.hasNumbers) {
      errors.push("Password must contain at least one number");
    } else if (!passwordRequirements.hasSpecialChar) {
      errors.push("Password must contain at least one special character (!@#$%^&* etc.)");
    } else if (!passwordRequirements.noSpaces) {
      errors.push("Password cannot contain spaces");
    }

    // Prevent SQL injection patterns
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b|['";\\])/i;
    if (sqlInjectionPattern.test(email) || sqlInjectionPattern.test(password)) {
      errors.push("Invalid characters detected");
    }

    // XSS prevention
    const xssPattern = /<script|javascript:|on\w+\s*=/i;
    if (xssPattern.test(email) || xssPattern.test(password)) {
      errors.push("Invalid input detected");
    }

    return errors;
  };

  // Check if user is temporarily locked out
  const isLockedOut = () => {
    if (lockoutTime) {
      const now = Date.now();
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      if (now - lockoutTime < lockoutDuration) {
        const remainingTime = Math.ceil((lockoutDuration - (now - lockoutTime)) / 1000 / 60);
        return `Too many failed attempts. Please try again in ${remainingTime} minutes.`;
      } else {
        // Reset lockout after time expires
        setLockoutTime(null);
        setAttempts(0);
      }
    }
    return null;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Check lockout status
    const lockoutMessage = isLockedOut();
    if (lockoutMessage) {
      setMessage(lockoutMessage);
      return;
    }

    // Validate inputs
    const validationErrors = validateInputs(email, password);
    if (validationErrors.length > 0) {
      setMessage(validationErrors[0]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          password: password 
        }),
      });

      // Try to parse JSON whether ok or not (backend should return helpful messages)
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        data = null;
      }

      if (!response.ok) {
        // Handle specific statuses
        if (response.status === 401) {
          // Incorrect email or password
          setAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= 5) {
              setLockoutTime(Date.now());
              setMessage(data?.message || "Too many failed attempts. Account temporarily locked for 15 minutes.");
            } else {
              setMessage(data?.message || `Login failed. ${5 - newAttempts} attempts remaining.`);
            }
            return newAttempts;
          });
        } else if (response.status === 429) {
          // Rate limited / too many attempts from backend
          setLockoutTime(Date.now());
          setMessage(data?.message || "Too many failed attempts. Please try again later.");
        } else if (response.status >= 400 && data && data.message) {
          // Any other known client error with message from backend
          setMessage(data.message);
        } else {
          // Fallback generic message
          setMessage(data?.message || "An unexpected error occurred. Please try again.");
        }
        return;
      }

      // Success path
      if (data && data.success) {
        // Reset attempts on successful login
        setAttempts(0);
        setLockoutTime(null);
        
        // Store authentication state securely
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.username); // Updated to use username
        localStorage.setItem("userId", data.user.id); // Store user ID
        localStorage.setItem("loginTime", new Date().toISOString());
        
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 1000);
      } else {
        // If backend returned success=false for some reason
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= 5) {
            setLockoutTime(Date.now());
            setMessage(data?.message || "Too many failed attempts. Account temporarily locked for 15 minutes.");
          } else {
            setMessage(data?.message || `Login failed. ${5 - newAttempts} attempts remaining.`);
          }
          return newAttempts;
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage("Connection error. Please check if backend is running.");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Show requirements when user starts typing in password
    if (newPassword.length > 0 && !showPasswordRequirements) {
      setShowPasswordRequirements(true);
    } else if (newPassword.length === 0) {
      setShowPasswordRequirements(false);
    }
    
    if (message) setMessage("");
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "" };
    
    const requirements = validatePassword(password);
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const totalRequirements = Object.keys(requirements).length - 1; // Exclude maxLength from calculation
    const strength = (metRequirements / totalRequirements) * 100;

    let text = "";
    if (strength < 40) text = "Weak";
    else if (strength < 70) text = "Medium";
    else if (strength < 90) text = "Strong";
    else text = "Very Strong";

    return { strength, text };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordRequirements = validatePassword(password);

  return (
    <div className="login-container">
      {/* Floating background elements */}
      <div className="login-cloud"></div>
      <div className="login-cloud"></div>
      <div className="login-cloud"></div>

      <div className="login-card">
        <h1 className="login-title">SkyCast</h1>
        <p className="login-subtitle">Secure Sign In</p>

        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="email" 
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
            maxLength="100"
            autoComplete="email"
          />

          <div className="password-container">
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className="login-input password-input"
                required
                minLength="8"
                maxLength="100"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1} // Prevent tab focus on toggle button
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            
            {password.length > 0 && (
              <div className="password-strength">
                <div 
                  className="strength-bar"
                  style={{ width: `${passwordStrength.strength}%` }}
                  data-strength={passwordStrength.text.toLowerCase()}
                ></div>
                <span className="strength-text">{passwordStrength.text}</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || !!lockoutTime}
          >
            {loading ? "🔐 Authenticating..." : "Sign In 🚀"}
          </button>
        </form>

        {message && (
          <p className={`login-message ${message.includes('successful') ? 'success-message' : 'error-message'}`}>
            {message}
          </p>
        )}

        {/* Password Requirements - Only show when user is typing password */}
        {showPasswordRequirements && (
          <div className="password-requirements">
            <p><strong>Password Requirements:</strong></p>
            <div className="requirement-list">
              <div className={`requirement-item ${passwordRequirements.minLength ? 'met' : 'unmet'}`}>
                {passwordRequirements.minLength ? '✓' : '•'} At least 8 characters
              </div>
              <div className={`requirement-item ${passwordRequirements.hasUpperCase ? 'met' : 'unmet'}`}>
                {passwordRequirements.hasUpperCase ? '✓' : '•'} One uppercase letter
              </div>
              <div className={`requirement-item ${passwordRequirements.hasLowerCase ? 'met' : 'unmet'}`}>
                {passwordRequirements.hasLowerCase ? '✓' : '•'} One lowercase letter
              </div>
              <div className={`requirement-item ${passwordRequirements.hasNumbers ? 'met' : 'unmet'}`}>
                {passwordRequirements.hasNumbers ? '✓' : '•'} One number
              </div>
              <div className={`requirement-item ${passwordRequirements.hasSpecialChar ? 'met' : 'unmet'}`}>
                {passwordRequirements.hasSpecialChar ? '✓' : '•'} One special character
              </div>
              <div className={`requirement-item ${passwordRequirements.noSpaces ? 'met' : 'unmet'}`}>
                {passwordRequirements.noSpaces ? '✓' : '•'} No spaces
              </div>
            </div>
          </div>
        )}

        {/* ADDED: Register link */}
        <div className="register-link">
          <p>Don't have an account? <Link to="/register">Sign up here</Link></p>
        </div>
      </div>
    </div>
  );
}