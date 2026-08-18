import { Request, Response } from 'express';
import { localDB, supabase } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    if (supabase) {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar, bio, created_at');

      if (error || !users) return res.status(500).json({ error: 'Failed fetching users directory.' });

      const detailedUsers = await Promise.all(
        users.map(async (u) => {
          const { count: ideasCount } = await supabase
            .from('ideas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', u.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', u.id);

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || 'student',
            avatar: u.avatar,
            bio: u.bio,
            createdAt: u.created_at,
            ideasCount: ideasCount || 0,
            commentsCount: commentsCount || 0
          };
        })
      );

      return res.json(detailedUsers);
    }

    const detailedUsers = localDB.users.map((u) => {
      const userIdeas = localDB.ideas.filter((i) => i.user_id === u.id);
      let totalUpvotesEarned = 0;
      userIdeas.forEach((i) => {
        totalUpvotesEarned += localDB.likes.filter((l) => l.idea_id === i.id).length;
      });
      const commentsCount = localDB.comments.filter((c) => c.user_id === u.id).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'student',
        avatar: u.avatar,
        bio: u.bio,
        createdAt: u.created_at,
        ideasCount: userIdeas.length,
        totalUpvotesEarned,
        commentsCount
      };
    });

    return res.json(detailedUsers);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed retrieving user list.' });
  }
}

export async function getUserProfile(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (supabase) {
      const { data: user, error } = await supabase.from('users').select('id, name, email, avatar, bio, created_at').eq('id', id).single();
      if (error || !user) return res.status(404).json({ error: 'User profile not found.' });

      const { data: userIdeas } = await supabase.from('ideas').select('*').eq('user_id', id);
      const postedIdeas = userIdeas || [];

      let totalUpvotesEarned = 0;
      for (const idea of postedIdeas) {
        const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('idea_id', idea.id);
        totalUpvotesEarned += count || 0;
      }

      const { count: commentsWrittenCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.created_at
        },
        stats: {
          ideasCount: postedIdeas.length,
          totalUpvotesEarned,
          commentsWrittenCount: commentsWrittenCount || 0
        }
      });
    }

    const user = localDB.users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    const postedIdeas = localDB.ideas.filter((i) => i.user_id === id);
    let totalUpvotesEarned = 0;

    postedIdeas.forEach((idea) => {
      const likes = localDB.likes.filter((l) => l.idea_id === idea.id);
      totalUpvotesEarned += likes.length;
    });

    const commentsWritten = localDB.comments.filter((c) => c.user_id === id);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at
      },
      stats: {
        ideasCount: postedIdeas.length,
        totalUpvotesEarned,
        commentsWrittenCount: commentsWritten.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed retrieving user profile.' });
  }
}
