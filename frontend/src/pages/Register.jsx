import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/pages/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // For password field
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password field

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
  const validateInputs = (data) => {
    const errors = [];

    // Username validation
    if (!data.username.trim()) {
      errors.push("Username is required");
    }

    if (data.username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (data.username.length > 30) {
      errors.push("Username must be less than 30 characters");
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(data.username)) {
      errors.push("Username can only contain letters, numbers, and underscores");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    const passwordRequirements = validatePassword(data.password);
    
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

    // Confirm password validation
    if (data.password !== data.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Prevent SQL injection patterns
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b|['";\\])/i;
    if (sqlInjectionPattern.test(data.email) || sqlInjectionPattern.test(data.password) || sqlInjectionPattern.test(data.username)) {
      errors.push("Invalid characters detected");
    }

    // XSS prevention
    const xssPattern = /<script|javascript:|on\w+\s*=/i;
    if (xssPattern.test(data.email) || xssPattern.test(data.password) || xssPattern.test(data.username)) {
      errors.push("Invalid input detected");
    }

    return errors;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Show password requirements when user starts typing in password fields
    if ((name === 'password' || name === 'confirmPassword') && value.length > 0) {
      setShowPasswordRequirements(true);
    } else if (name === 'password' && value.length === 0 && formData.confirmPassword.length === 0) {
      setShowPasswordRequirements(false);
    }

    // Clear message when user starts typing
    if (message) setMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Validate inputs
    const validationErrors = validateInputs(formData);
    if (validationErrors.length > 0) {
      setMessage(validationErrors[0]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage("Connection error. Please check if backend is running.");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "" };
    
    const requirements = validatePassword(password);
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const totalRequirements = Object.keys(requirements).length - 1; // Exclude maxLength
    const strength = (metRequirements / totalRequirements) * 100;

    let text = "";
    if (strength < 40) text = "Weak";
    else if (strength < 70) text = "Medium";
    else if (strength < 90) text = "Strong";
    else text = "Very Strong";

    return { strength, text };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordRequirements = validatePassword(formData.password);

  return (
    <div className="register-container">
      {/* Floating background elements */}
      <div className="register-cloud"></div>
      <div className="register-cloud"></div>
      <div className="register-cloud"></div>

      <div className="register-card">
        <h1 className="register-title">SkyCast</h1>
        <p className="register-subtitle">Create Your Account</p>

        <form onSubmit={handleRegister} className="register-form">
          <input 
            type="text" 
            name="username"
            placeholder="Username *"
            value={formData.username}
            onChange={handleChange}
            className="register-input"
            required
            minLength="3"
            maxLength="30"
            autoComplete="username"
          />

          <input 
            type="email" 
            name="email"
            placeholder="Email Address *"
            value={formData.email}
            onChange={handleChange}
            className="register-input"
            required
            maxLength="100"
            autoComplete="email"
          />

          <div className="password-container">
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                className="register-input password-input"
                required
                minLength="8"
                maxLength="100"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formData.password.length > 0 && (
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

          <div className="password-container">
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="register-input password-input"
                required
                minLength="8"
                maxLength="100"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                tabIndex={-1}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account 🚀"}
          </button>
        </form>

        {message && (
          <p className={`register-message ${message.includes('successful') ? 'success-message' : 'error-message'}`}>
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
              <div className={`requirement-item ${formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? 'met' : 'unmet'}`}>
                {formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? '✓' : '•'} Passwords match
              </div>
            </div>
          </div>
        )}

        <div className="login-link">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}