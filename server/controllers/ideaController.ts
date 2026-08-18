import { Request, Response } from 'express';
import { localDB, calculateDistanceKm, supabase, IdeaDB, VerificationDB, StatusHistoryEntry } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { predictCategoryAndSeverity, detectDuplicates, translateContent } from '../services/aiService';

export async function getAllIdeas(req: AuthRequest, res: Response) {
  try {
    const { lat, lng, radius, category, severity, status, search, sortBy, userId } = req.query;

    const targetLat = lat ? parseFloat(lat as string) : undefined;
    const targetLng = lng ? parseFloat(lng as string) : undefined;
    const refLat = targetLat !== undefined ? targetLat : 13.0827;
    const refLng = targetLng !== undefined ? targetLng : 80.2707;

    const radiusKm = radius ? parseFloat(radius as string) : 0; // 0 means any distance
    const currentUserId = req.user?.id;

    if (supabase) {
      let query = supabase.from('ideas').select('*, users(name, avatar)');

      if (category && category !== 'All') {
        query = query.eq('category', category as string);
      }
      if (severity && severity !== 'All') {
        query = query.eq('severity', severity as string);
      }
      if (status && status !== 'All') {
        query = query.eq('status', status as string);
      }
      if (userId) {
        query = query.eq('user_id', userId as string);
      }

      const { data: rawIdeas, error } = await query;
      if (error) throw error;

      let formatted = await Promise.all(
        (rawIdeas || []).map(async (item: any) => {
          const { count: likesCount } = await supabase!
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', item.id);

          const { count: commentsCount } = await supabase!
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', item.id);

          const { count: verificationsCount } = await supabase!
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', item.id);

          let isLikedByUser = false;
          let isVerifiedByUser = false;

          if (currentUserId) {
            const { data: userLike } = await supabase!
              .from('likes')
              .select('*')
              .eq('idea_id', item.id)
              .eq('user_id', currentUserId)
              .single();
            isLikedByUser = !!userLike;

            const { data: userVerification } = await supabase!
              .from('verifications')
              .select('*')
              .eq('idea_id', item.id)
              .eq('user_id', currentUserId)
              .single();
            isVerifiedByUser = !!userVerification;
          }

          const distanceKm = calculateDistanceKm(refLat, refLng, item.latitude, item.longitude);

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            category: item.category,
            severity: item.severity || 'medium',
            status: item.status || 'submitted',
            departmentAssigned: item.department_assigned,
            assignedOfficialName: item.assigned_official_name,
            resolutionNotes: item.resolution_notes,
            resolutionImageUrl: item.resolution_image_url,
            aiConfidenceScore: item.ai_confidence_score || 90,
            aiDetectedTags: item.ai_detected_tags || [item.category],
            statusHistory: item.status_history || [],
            imageUrl: item.image_url,
            userId: item.user_id,
            userName: item.users?.name || 'Anonymous Citizen',
            userAvatar: item.users?.avatar,
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            verificationsCount: verificationsCount || 0,
            isLikedByUser,
            isVerifiedByUser,
            distanceKm,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          };
        })
      );

      // Filtering by distance & search
      if (radiusKm > 0) {
        formatted = formatted.filter((idea) => idea.distanceKm !== undefined && idea.distanceKm <= radiusKm);
      }

      if (search && typeof search === 'string' && search.trim()) {
        const term = search.toLowerCase().trim();
        formatted = formatted.filter(
          (idea) =>
            idea.title.toLowerCase().includes(term) ||
            idea.description.toLowerCase().includes(term) ||
            (idea.address && idea.address.toLowerCase().includes(term))
        );
      }

      // Sorting
      const getTime = (dateStr?: string) => {
        if (!dateStr) return 0;
        const t = new Date(dateStr).getTime();
        return isNaN(t) ? 0 : t;
      };

      if (sortBy === 'nearest') {
        formatted.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      } else if (sortBy === 'top') {
        formatted.sort((a, b) => b.likesCount - a.likesCount);
      } else if (sortBy === 'verified') {
        formatted.sort((a, b) => b.verificationsCount - a.verificationsCount);
      } else if (sortBy === 'comments') {
        formatted.sort((a, b) => b.commentsCount - a.commentsCount);
      } else if (sortBy === 'critical') {
        const sevWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        formatted.sort((a, b) => (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0));
      } else {
        // default recent / latest posted
        formatted.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
      }

      return res.json(formatted);
    }

    // Local DB execution
    let ideasList = [...localDB.ideas];

    if (category && category !== 'All') {
      ideasList = ideasList.filter((i) => i.category === category);
    }
    if (severity && severity !== 'All') {
      ideasList = ideasList.filter((i) => i.severity === severity);
    }
    if (status && status !== 'All') {
      ideasList = ideasList.filter((i) => i.status === status);
    }
    if (userId) {
      ideasList = ideasList.filter((i) => i.user_id === userId);
    }

    let formatted = ideasList.map((item) => {
      const author = localDB.users.find((u) => u.id === item.user_id);
      const likesCount = localDB.likes.filter((l) => l.idea_id === item.id).length;
      const commentsCount = localDB.comments.filter((c) => c.idea_id === item.id).length;
      const verificationsCount = localDB.verifications.filter((v) => v.idea_id === item.id).length;

      const isLikedByUser = currentUserId
        ? localDB.likes.some((l) => l.idea_id === item.id && l.user_id === currentUserId)
        : false;

      const isVerifiedByUser = currentUserId
        ? localDB.verifications.some((v) => v.idea_id === item.id && v.user_id === currentUserId)
        : false;

      const distanceKm = calculateDistanceKm(refLat, refLng, item.latitude, item.longitude);

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        category: item.category as any,
        severity: item.severity || 'medium',
        status: item.status || 'submitted',
        departmentAssigned: item.department_assigned,
        assignedOfficialName: item.assigned_official_name,
        resolutionNotes: item.resolution_notes,
        resolutionImageUrl: item.resolution_image_url,
        aiConfidenceScore: item.ai_confidence_score || 90,
        aiDetectedTags: item.ai_detected_tags || [item.category],
        statusHistory: item.status_history || [],
        imageUrl: item.image_url,
        userId: item.user_id,
        userName: author?.name || 'Anonymous Citizen',
        userAvatar: author?.avatar,
        likesCount,
        commentsCount,
        verificationsCount,
        isLikedByUser,
        isVerifiedByUser,
        distanceKm,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    // Distance filter
    if (radiusKm > 0) {
      formatted = formatted.filter((idea) => idea.distanceKm !== undefined && idea.distanceKm <= radiusKm);
    }

    // Search filter
    if (search && typeof search === 'string' && search.trim()) {
      const term = search.toLowerCase().trim();
      formatted = formatted.filter(
        (idea) =>
          idea.title.toLowerCase().includes(term) ||
          idea.description.toLowerCase().includes(term) ||
          (idea.address && idea.address.toLowerCase().includes(term))
      );
    }

    // Helper for safe timestamp parsing
    const getTime = (dateStr?: string) => {
      if (!dateStr) return 0;
      const t = new Date(dateStr).getTime();
      return isNaN(t) ? 0 : t;
    };

    // Sorting
    if (sortBy === 'nearest') {
      formatted.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sortBy === 'top') {
      formatted.sort((a, b) => b.likesCount - a.likesCount);
    } else if (sortBy === 'verified') {
      formatted.sort((a, b) => b.verificationsCount - a.verificationsCount);
    } else if (sortBy === 'comments') {
      formatted.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (sortBy === 'critical') {
      const sevWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      formatted.sort((a, b) => (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0));
    } else {
      // Default: recent / latest posted
      formatted.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    }

    return res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    return res.status(500).json({ error: 'Failed to retrieve geo ideas.' });
  }
}

export async function getIdeaById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (supabase) {
      const { data: item, error } = await supabase.from('ideas').select('*, users(name, avatar)').eq('id', id).single();
      if (error || !item) return res.status(404).json({ error: 'Geo idea not found.' });

      const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('idea_id', id);
      const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('idea_id', id);
      const { count: verificationsCount } = await supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('idea_id', id);

      let isLikedByUser = false;
      let isVerifiedByUser = false;

      if (currentUserId) {
        const { data: userLike } = await supabase.from('likes').select('*').eq('idea_id', id).eq('user_id', currentUserId).single();
        isLikedByUser = !!userLike;

        const { data: userVerification } = await supabase.from('verifications').select('*').eq('idea_id', id).eq('user_id', currentUserId).single();
        isVerifiedByUser = !!userVerification;
      }

      return res.json({
        id: item.id,
        title: item.title,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        category: item.category,
        severity: item.severity || 'medium',
        status: item.status || 'submitted',
        departmentAssigned: item.department_assigned,
        assignedOfficialName: item.assigned_official_name,
        resolutionNotes: item.resolution_notes,
        resolutionImageUrl: item.resolution_image_url,
        aiConfidenceScore: item.ai_confidence_score || 90,
        aiDetectedTags: item.ai_detected_tags || [item.category],
        statusHistory: item.status_history || [],
        imageUrl: item.image_url,
        userId: item.user_id,
        userName: item.users?.name || 'Anonymous Citizen',
        userAvatar: item.users?.avatar,
        likesCount: likesCount || 0,
        commentsCount: commentsCount || 0,
        verificationsCount: verificationsCount || 0,
        isLikedByUser,
        isVerifiedByUser,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      });
    }

    const item = localDB.ideas.find((i) => i.id === id);
    if (!item) return res.status(404).json({ error: 'Geo idea not found.' });

    const author = localDB.users.find((u) => u.id === item.user_id);
    const likesCount = localDB.likes.filter((l) => l.idea_id === item.id).length;
    const commentsCount = localDB.comments.filter((c) => c.idea_id === item.id).length;
    const verificationsCount = localDB.verifications.filter((v) => v.idea_id === item.id).length;

    const isLikedByUser = currentUserId
      ? localDB.likes.some((l) => l.idea_id === item.id && l.user_id === currentUserId)
      : false;

    const isVerifiedByUser = currentUserId
      ? localDB.verifications.some((v) => v.idea_id === item.id && v.user_id === currentUserId)
      : false;

    return res.json({
      id: item.id,
      title: item.title,
      description: item.description,
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address,
      category: item.category,
      severity: item.severity || 'medium',
      status: item.status || 'submitted',
      departmentAssigned: item.department_assigned,
      assignedOfficialName: item.assigned_official_name,
      resolutionNotes: item.resolution_notes,
      resolutionImageUrl: item.resolution_image_url,
      aiConfidenceScore: item.ai_confidence_score || 90,
      aiDetectedTags: item.ai_detected_tags || [item.category],
      statusHistory: item.status_history || [],
      imageUrl: item.image_url,
      userId: item.user_id,
      userName: author?.name || 'Anonymous Citizen',
      userAvatar: author?.avatar,
      likesCount,
      commentsCount,
      verificationsCount,
      isLikedByUser,
      isVerifiedByUser,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error fetching idea details.' });
  }
}

export async function checkDuplicate(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required for duplicate checking.' });
    }

    const result = await detectDuplicates(title, description || '', localDB.ideas);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed checking duplicates.' });
  }
}

export async function predictAi(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required for AI prediction.' });
    }

    const prediction = await predictCategoryAndSeverity(title, description);
    return res.json(prediction);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed running AI prediction.' });
  }
}

export async function translateIdea(req: Request, res: Response) {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and targetLang are required.' });
    }

    const translation = await translateContent(text, targetLang);
    return res.json(translation);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed translating text.' });
  }
}

export async function createIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const { title, description, category, severity, latitude, longitude, address, imageUrl } = req.body;

    if (!title || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Title, description, latitude, and longitude are required.' });
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude coordinate values.' });
    }

    // AI Prediction & Tag generation
    const aiResult = await predictCategoryAndSeverity(title, description);
    const finalCategory = category || aiResult.category;
    const finalSeverity = severity || aiResult.severity;
    const finalDepartment = aiResult.department;

    const now = new Date().toISOString();

    const initialHistory: StatusHistoryEntry[] = [
      {
        status: 'submitted',
        updatedBy: req.user.name,
        role: req.user.role || 'citizen',
        timestamp: now,
        note: 'Issue reported by citizen.'
      }
    ];

    if (supabase) {
      const { data: newIdea, error } = await supabase
        .from('ideas')
        .insert({
          user_id: req.user.id,
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          severity: finalSeverity,
          status: 'submitted',
          department_assigned: finalDepartment,
          latitude: latNum,
          longitude: lngNum,
          address: address || `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
          image_url: imageUrl || null,
          ai_confidence_score: aiResult.confidenceScore,
          ai_detected_tags: aiResult.detectedTags,
          status_history: initialHistory
        })
        .select()
        .single();

      if (error || !newIdea) throw new Error(error?.message || 'Failed creating idea in Supabase.');

      return res.status(201).json({
        id: newIdea.id,
        title: newIdea.title,
        description: newIdea.description,
        latitude: newIdea.latitude,
        longitude: newIdea.longitude,
        address: newIdea.address,
        category: newIdea.category,
        severity: newIdea.severity,
        status: newIdea.status,
        departmentAssigned: newIdea.department_assigned,
        aiConfidenceScore: newIdea.ai_confidence_score,
        aiDetectedTags: newIdea.ai_detected_tags,
        statusHistory: newIdea.status_history,
        imageUrl: newIdea.image_url,
        userId: req.user.id,
        userName: req.user.name,
        likesCount: 0,
        commentsCount: 0,
        verificationsCount: 0,
        isLikedByUser: false,
        isVerifiedByUser: false,
        createdAt: newIdea.created_at,
        updatedAt: newIdea.updated_at
      });
    }

    const newIdea: IdeaDB = {
      id: `idea-${Date.now()}`,
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: finalCategory,
      severity: finalSeverity as any,
      status: 'submitted',
      department_assigned: finalDepartment,
      latitude: latNum,
      longitude: lngNum,
      address: address || `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`,
      image_url: imageUrl || undefined,
      ai_confidence_score: aiResult.confidenceScore,
      ai_detected_tags: aiResult.detectedTags,
      status_history: initialHistory,
      created_at: now,
      updated_at: now
    };

    localDB.ideas.unshift(newIdea);

    // Award +10 Gamification Points for submitting an issue
    const author = localDB.users.find((u) => u.id === req.user!.id);
    if (author) {
      author.points = (author.points || 0) + 10;
    }

    localDB.persist();

    return res.status(201).json({
      id: newIdea.id,
      title: newIdea.title,
      description: newIdea.description,
      latitude: newIdea.latitude,
      longitude: newIdea.longitude,
      address: newIdea.address,
      category: newIdea.category,
      severity: newIdea.severity,
      status: newIdea.status,
      departmentAssigned: newIdea.department_assigned,
      aiConfidenceScore: newIdea.ai_confidence_score,
      aiDetectedTags: newIdea.ai_detected_tags,
      statusHistory: newIdea.status_history,
      imageUrl: newIdea.image_url,
      userId: req.user.id,
      userName: author?.name || req.user.name,
      userAvatar: author?.avatar,
      likesCount: 0,
      commentsCount: 0,
      verificationsCount: 0,
      isLikedByUser: false,
      isVerifiedByUser: false,
      createdAt: newIdea.created_at,
      updatedAt: newIdea.updated_at
    });
  } catch (error: any) {
    console.error('Error creating idea:', error);
    return res.status(500).json({ error: error.message || 'Server error creating geo idea.' });
  }
}

export async function verifyIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { id: ideaId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const idea = localDB.ideas.find((i) => i.id === ideaId);
    if (!idea) return res.status(404).json({ error: 'Issue report not found.' });

    const existingVerification = localDB.verifications.find((v) => v.idea_id === ideaId && v.user_id === userId);
    if (existingVerification) {
      return res.status(400).json({ error: 'You have already verified this issue location.' });
    }

    const verification: VerificationDB = {
      id: `v-${Date.now()}`,
      idea_id: ideaId,
      user_id: userId,
      comment: comment || 'Verified on site.',
      created_at: new Date().toISOString()
    };

    localDB.verifications.push(verification);

    // Auto-promote status to 'verified' if verifications count >= 3
    const totalVerifications = localDB.verifications.filter((v) => v.idea_id === ideaId).length;
    if (totalVerifications >= 3 && idea.status === 'submitted') {
      idea.status = 'verified';
      if (!idea.status_history) idea.status_history = [];
      idea.status_history.push({
        status: 'verified',
        updatedBy: 'Community Verification Engine',
        role: 'system',
        timestamp: new Date().toISOString(),
        note: `Reached ${totalVerifications} community verifications.`
      });
    }

    // Award +5 points to verifier
    const verifier = localDB.users.find((u) => u.id === userId);
    if (verifier) {
      verifier.points = (verifier.points || 0) + 5;
    }

    localDB.persist();

    return res.json({
      message: 'Community verification logged successfully!',
      verificationsCount: totalVerifications,
      isVerifiedByUser: true,
      currentStatus: idea.status
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed logging verification.' });
  }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { id: ideaId } = req.params;
    const { status, departmentAssigned, assignedOfficialName, resolutionNotes, resolutionImageUrl } = req.body;

    const userRole = req.user.role || 'citizen';
    if (!['official', 'moderator', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Only officials, moderators, or admins can update status.' });
    }

    const idea = localDB.ideas.find((i) => i.id === ideaId);
    if (!idea) return res.status(404).json({ error: 'Issue report not found.' });

    const previousStatus = idea.status;
    if (status) idea.status = status;
    if (departmentAssigned) idea.department_assigned = departmentAssigned;
    if (assignedOfficialName) idea.assigned_official_name = assignedOfficialName;
    if (resolutionNotes) idea.resolution_notes = resolutionNotes;
    if (resolutionImageUrl) idea.resolution_image_url = resolutionImageUrl;

    idea.updated_at = new Date().toISOString();

    if (!idea.status_history) idea.status_history = [];
    idea.status_history.push({
      status: status || previousStatus || 'updated',
      updatedBy: req.user.name,
      role: userRole,
      timestamp: new Date().toISOString(),
      note: resolutionNotes || `Status updated from ${previousStatus} to ${status}`
    });

    localDB.persist();

    return res.json({
      message: 'Status updated successfully.',
      idea
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed updating issue status.' });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const ideas = localDB.ideas;
    const totalIssues = ideas.length;
    const resolvedCount = ideas.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const inProgressCount = ideas.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length;
    const pendingCount = ideas.filter((i) => i.status === 'submitted' || i.status === 'verified' || i.status === 'under_review').length;

    const categoriesMap: Record<string, number> = {};
    const severityMap: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const departmentMap: Record<string, number> = {};

    ideas.forEach((i) => {
      categoriesMap[i.category] = (categoriesMap[i.category] || 0) + 1;
      const sev = i.severity || 'medium';
      severityMap[sev] = (severityMap[sev] || 0) + 1;
      const dept = i.department_assigned || 'Unassigned';
      departmentMap[dept] = (departmentMap[dept] || 0) + 1;
    });

    return res.json({
      totalIssues,
      resolvedCount,
      inProgressCount,
      pendingCount,
      resolutionRatePercent: totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0,
      categoriesMap,
      severityMap,
      departmentMap,
      recentActivityCount: localDB.verifications.length + localDB.comments.length + localDB.likes.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed calculating analytics.' });
  }
}

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const sortedUsers = [...localDB.users]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map((u, index) => {
        const userIdeas = localDB.ideas.filter((i) => i.user_id === u.id);
        const userVerifications = localDB.verifications.filter((v) => v.user_id === u.id);
        return {
          rank: index + 1,
          id: u.id,
          name: u.name,
          role: u.role || 'citizen',
          avatar: u.avatar,
          points: u.points || 10,
          badges: u.badges || ['Civic Contributor'],
          issuesSubmittedCount: userIdeas.length,
          verificationsGivenCount: userVerifications.length
        };
      });

    return res.json(sortedUsers);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed fetching community leaderboard.' });
  }
}

export async function updateIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const { id } = req.params;
    const { title, description, category, imageUrl, severity } = req.body;

    if (supabase) {
      const { data: existing } = await supabase.from('ideas').select('*').eq('id', id).single();
      if (!existing) return res.status(404).json({ error: 'Idea not found.' });
      if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own posted ideas.' });
      }

      const { data: updated, error } = await supabase
        .from('ideas')
        .update({
          title: title ? title.trim() : existing.title,
          description: description ? description.trim() : existing.description,
          category: category || existing.category,
          severity: severity || existing.severity,
          image_url: imageUrl !== undefined ? imageUrl : existing.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(updated);
    }

    const idea = localDB.ideas.find((i) => i.id === id);
    if (!idea) return res.status(404).json({ error: 'Idea not found.' });
    if (idea.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own posted ideas.' });
    }

    if (title) idea.title = title.trim();
    if (description) idea.description = description.trim();
    if (category) idea.category = category;
    if (severity) idea.severity = severity;
    if (imageUrl !== undefined) idea.image_url = imageUrl;
    idea.updated_at = new Date().toISOString();

    localDB.persist();
    return res.json(idea);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed updating geo idea.' });
  }
}

export async function deleteIdea(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { id } = req.params;

    if (supabase) {
      const { data: existing } = await supabase.from('ideas').select('*').eq('id', id).single();
      if (!existing) return res.status(404).json({ error: 'Idea not found.' });
      if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own ideas.' });
      }

      await supabase.from('ideas').delete().eq('id', id);
      return res.json({ message: 'Idea successfully deleted.' });
    }

    const index = localDB.ideas.findIndex((i) => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Idea not found.' });
    if (localDB.ideas[index].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own ideas.' });
    }

    localDB.ideas.splice(index, 1);
    // Remove associated likes, comments, verifications
    const likesToKeep = localDB.likes.filter((l) => l.idea_id !== id);
    const commentsToKeep = localDB.comments.filter((c) => c.idea_id !== id);
    const verificationsToKeep = localDB.verifications.filter((v) => v.idea_id !== id);
    
    localDB.likes.length = 0;
    localDB.likes.push(...likesToKeep);
    localDB.comments.length = 0;
    localDB.comments.push(...commentsToKeep);
    localDB.verifications.length = 0;
    localDB.verifications.push(...verificationsToKeep);

    localDB.persist();

    return res.json({ message: 'Idea successfully deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed deleting geo idea.' });
  }
}

export async function toggleLike(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const { id: ideaId } = req.params;
    const userId = req.user.id;

    if (supabase) {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('likes').insert({ idea_id: ideaId, user_id: userId });
      }

      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', ideaId);

      return res.json({
        isLikedByUser: !existingLike,
        likesCount: likesCount || 0
      });
    }

    const likeIndex = localDB.likes.findIndex((l) => l.idea_id === ideaId && l.user_id === userId);
    let isLikedByUser = false;

    if (likeIndex !== -1) {
      localDB.likes.splice(likeIndex, 1);
      isLikedByUser = false;
    } else {
      localDB.likes.push({
        id: `like-${Date.now()}`,
        idea_id: ideaId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      isLikedByUser = true;
    }

    localDB.persist();
    const likesCount = localDB.likes.filter((l) => l.idea_id === ideaId).length;

    return res.json({
      isLikedByUser,
      likesCount
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed toggling upvote.' });
  }
}

