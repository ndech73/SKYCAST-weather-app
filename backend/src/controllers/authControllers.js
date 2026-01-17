import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db.js';

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 255);
};

// Enhanced password strength validation
const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  
  const requirements = {
    minLength: password.length >= 8,
    maxLength: password.length <= 100,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password)
  };

  return Object.values(requirements).every(req => req === true);
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Username validation
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 30;
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// In-memory store for failed attempts
const failedAttempts = new Map();

// Clear failed attempts after 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of failedAttempts.entries()) {
    if (now - value.timestamp > 15 * 60 * 1000) {
      failedAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Register controller
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    console.log('📝 Registration attempt:', { username, email: email?.substring(0, 3) + '***' });
    
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Validate inputs
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and can only contain letters, numbers, and underscores'
      });
    }

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-100 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizedUsername },
          { email: sanitizedEmail }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === sanitizedUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      } else {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    console.log('✅ User registered successfully:', newUser.username);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in.',
      user: newUser
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    console.log('🔐 Login attempt from:', clientIP);
    
    // Check for too many failed attempts
    const attemptData = failedAttempts.get(clientIP);
    if (attemptData && attemptData.count >= 5) {
      const timeSinceFirstAttempt = Date.now() - attemptData.timestamp;
      if (timeSinceFirstAttempt < 15 * 60 * 1000) { // 15 minutes
        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Please try again in 15 minutes.'
        });
      } else {
        // Reset after 15 minutes
        failedAttempts.delete(clientIP);
      }
    }

    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Validate inputs
    if (!validateEmail(sanitizedEmail)) {
      const attempts = failedAttempts.get(clientIP) || { count: 0, timestamp: Date.now() };
      failedAttempts.set(clientIP, { count: attempts.count + 1, timestamp: Date.now() });
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      const attempts = failedAttempts.get(clientIP) || { count: 0, timestamp: Date.now() };
      failedAttempts.set(clientIP, { count: attempts.count + 1, timestamp: Date.now() });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      const attempts = failedAttempts.get(clientIP) || { count: 0, timestamp: Date.now() };
      failedAttempts.set(clientIP, { count: attempts.count + 1, timestamp: Date.now() });
      console.log('❌ Invalid password for:', sanitizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed attempts on successful login
    failedAttempts.delete(clientIP);

    console.log('✅ Login successful for:', user.username);

    // SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { 
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.username // Use username as display name
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Forgot password controller
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      // Don't reveal whether email exists for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token
    await prisma.resetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: expiresAt
      }
    });

    // TODO: Send email with reset link
    console.log(`🔑 Password reset token for ${sanitizedEmail}: ${resetToken}`);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, return the token for testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// Reset password controller
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-100 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Find valid reset token
    const resetToken = await prisma.resetToken.findFirst({
      where: {
        token: token,
        used: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: newPasswordHash }
      }),
      prisma.resetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);
    
    console.log('✅ Password reset successfully for user:', resetToken.userId);
    
    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Verify reset token controller
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await prisma.resetToken.findFirst({
      where: {
        token: token,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
};