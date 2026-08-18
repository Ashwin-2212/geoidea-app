import { Router } from 'express';
import { getComments, addComment, deleteComment } from '../controllers/commentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/idea/:ideaId', getComments);
router.post('/idea/:ideaId', authMiddleware, addComment);
router.delete('/:id', authMiddleware, deleteComment);

export default router;
