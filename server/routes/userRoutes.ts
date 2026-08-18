import { Router } from 'express';
import { getUserProfile, getAllUsers } from '../controllers/userController';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, getAllUsers);
router.get('/:id/profile', optionalAuthMiddleware, getUserProfile);

export default router;
