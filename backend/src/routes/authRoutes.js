import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  verifyResetToken 
} from '../controllers/authControllers.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

export default router;