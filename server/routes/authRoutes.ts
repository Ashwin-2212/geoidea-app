import { Router } from 'express';
import { register, login, getMe, refreshTokenHandler, forgotPassword, resetPassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshTokenHandler);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getMe);

export default router;

