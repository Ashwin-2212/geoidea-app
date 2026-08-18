import { Request, Response } from 'express';
import { localDB, supabase, CommentDB } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getComments(req: Request, res: Response) {
  try {
    const { ideaId } = req.params;

    if (supabase) {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*, users(name, avatar)')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (comments || []).map((c: any) => ({
        id: c.id,
        ideaId: c.idea_id,
        userId: c.user_id,
        userName: c.users?.name || 'Anonymous',
        userAvatar: c.users?.avatar,
        text: c.text,
        createdAt: c.created_at
      }));

      return res.json(formatted);
    }

    const comments = localDB.comments
      .filter((c) => c.idea_id === ideaId)
      .map((c) => {
        const author = localDB.users.find((u) => u.id === c.user_id);
        return {
          id: c.id,
          ideaId: c.idea_id,
          userId: c.user_id,
          userName: author?.name || 'Anonymous',
          userAvatar: author?.avatar,
          text: c.text,
          createdAt: c.created_at
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json(comments);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed fetching comments.' });
  }
}

export async function addComment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { ideaId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const now = new Date().toISOString();

    if (supabase) {
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          idea_id: ideaId,
          user_id: req.user.id,
          text: text.trim()
        })
        .select('*, users(name, avatar)')
        .single();

      if (error || !newComment) throw error;

      return res.status(201).json({
        id: newComment.id,
        ideaId: newComment.idea_id,
        userId: newComment.user_id,
        userName: newComment.users?.name || req.user.name,
        userAvatar: newComment.users?.avatar,
        text: newComment.text,
        createdAt: newComment.created_at
      });
    }

    const newComment: CommentDB = {
      id: `comment-${Date.now()}`,
      idea_id: ideaId,
      user_id: req.user.id,
      text: text.trim(),
      created_at: now
    };

    localDB.comments.push(newComment);
    localDB.persist();

    const author = localDB.users.find((u) => u.id === req.user!.id);

    return res.status(201).json({
      id: newComment.id,
      ideaId: newComment.idea_id,
      userId: newComment.user_id,
      userName: author?.name || req.user.name,
      userAvatar: author?.avatar,
      text: newComment.text,
      createdAt: newComment.created_at
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed posting comment.' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { id } = req.params;

    if (supabase) {
      const { data: comment } = await supabase.from('comments').select('*').eq('id', id).single();
      if (!comment) return res.status(404).json({ error: 'Comment not found.' });
      if (comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
      }

      await supabase.from('comments').delete().eq('id', id);
      return res.json({ message: 'Comment deleted.' });
    }

    const index = localDB.comments.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Comment not found.' });
    if (localDB.comments[index].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments.' });
    }

    localDB.comments.splice(index, 1);
    localDB.persist();

    return res.json({ message: 'Comment deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed deleting comment.' });
  }
}
