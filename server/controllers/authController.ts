import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { localDB, supabase, UserDB } from '../config/db';
import { generateToken, generateRefreshToken, verifyRefreshToken, AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, department, avatar, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validRole = ['citizen', 'moderator', 'official', 'admin'].includes(role) ? role : 'citizen';

    // Check if user exists in Supabase or localDB
    if (supabase) {
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', cleanEmail).single();
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          email: cleanEmail,
          password_hash: passwordHash,
          role: validRole,
          department: department || null,
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
          bio: bio || `Active CivicPulse ${validRole} contributor in Chennai.`
        })
        .select()
        .single();

      if (insertError || !newUser) {
        throw new Error(insertError?.message || 'Failed creating user in database.');
      }

      const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
      const refreshToken = generateRefreshToken({ id: newUser.id, email: newUser.email, name: newUser.name });

      return res.status(201).json({
        token,
        refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role || validRole,
          department: newUser.department,
          avatar: newUser.avatar,
          bio: newUser.bio,
          points: 10,
          badges: ['Civic Pioneer'],
          isVerified: true,
          createdAt: newUser.created_at
        }
      });
    }

    // Local DB execution
    const existing = localDB.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    const newUser: UserDB = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role: validRole,
      department: department || undefined,
      avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
      bio: bio || `Active CivicPulse ${validRole} contributor in Chennai`,
      points: 10,
      badges: ['Civic Pioneer'],
      is_verified: true,
      created_at: new Date().toISOString()
    };

    localDB.users.push(newUser);
    localDB.persist();

    const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
    const refreshToken = generateRefreshToken({ id: newUser.id, email: newUser.email, name: newUser.name });

    return res.status(201).json({
      token,
      refreshToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar: newUser.avatar,
        bio: newUser.bio,
        points: newUser.points || 10,
        badges: newUser.badges || ['Civic Pioneer'],
        isVerified: newUser.is_verified,
        createdAt: newUser.created_at
      }
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during user registration.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (supabase) {
      const { data: user } = await supabase.from('users').select('*').eq('email', cleanEmail).single();
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, name: user.name });

      return res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'citizen',
          department: user.department,
          avatar: user.avatar,
          bio: user.bio,
          points: user.points || 50,
          badges: user.badges || ['Local Hero'],
          isVerified: user.is_verified ?? true,
          createdAt: user.created_at
        }
      });
    }

    const user = localDB.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, name: user.name });

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'citizen',
        department: user.department,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points || 50,
        badges: user.badges || ['Local Hero'],
        isVerified: user.is_verified ?? true,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during user login.' });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please sign in again.' });
    }

    const user = localDB.users.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists.' });
    }

    const newToken = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, name: user.name });

    return res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points || 50,
        badges: user.badges || ['Local Hero'],
        isVerified: user.is_verified ?? true,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Could not refresh authorization token.' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = localDB.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Return success message anyway for security
    return res.json({ message: 'If an account exists with this email, a reset code has been issued.' });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_token = resetCode;
  localDB.persist();

  return res.json({
    message: 'Reset code generated successfully.',
    demoResetCode: resetCode, // For interactive demonstration
    info: `Verification code sent to ${cleanEmail}. Demo code: ${resetCode}`
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
  }

  const user = localDB.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || user.reset_token !== resetCode) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }

  user.password_hash = bcrypt.hashSync(newPassword, 8);
  user.reset_token = undefined;
  localDB.persist();

  return res.json({ message: 'Password reset successful! You can now log in with your new password.' });
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (supabase) {
      const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'citizen',
        department: user.department,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points || 50,
        badges: user.badges || ['Local Hero'],
        isVerified: user.is_verified ?? true,
        languagePreference: user.language_preference || 'en',
        createdAt: user.created_at
      });
    }

    const user = localDB.users.find((u) => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'citizen',
      department: user.department,
      avatar: user.avatar,
      bio: user.bio,
      points: user.points || 50,
      badges: user.badges || ['Local Hero'],
      isVerified: user.is_verified ?? true,
      languagePreference: user.language_preference || 'en',
      createdAt: user.created_at
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error fetching authenticated user profile.' });
  }
}

