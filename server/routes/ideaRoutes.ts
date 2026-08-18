import { Router } from 'express';
import {
  getAllIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  toggleLike,
  checkDuplicate,
  predictAi,
  translateIdea,
  verifyIdea,
  updateStatus,
  getAnalytics,
  getLeaderboard
} from '../controllers/ideaController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, getAllIdeas);
router.post('/check-duplicate', checkDuplicate);
router.post('/ai-predict', predictAi);
router.post('/translate', translateIdea);
router.get('/analytics', getAnalytics);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', optionalAuthMiddleware, getIdeaById);
router.post('/', authMiddleware, createIdea);
router.put('/:id', authMiddleware, updateIdea);
router.delete('/:id', authMiddleware, deleteIdea);
router.post('/:id/like', authMiddleware, toggleLike);
router.post('/:id/verify', authMiddleware, verifyIdea);
router.patch('/:id/status', authMiddleware, updateStatus);

export default router;

