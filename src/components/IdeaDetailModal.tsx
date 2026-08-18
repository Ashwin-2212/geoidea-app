import React, { useState, useEffect } from 'react';
import { GeoIdea, Comment, IssueStatus } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Send,
  Trash2,
  Calendar,
  AlertCircle,
  Share2,
  Compass,
  CheckCircle2,
  Building2,
  Globe,
  Clock,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Bot
} from 'lucide-react';

interface IdeaDetailModalProps {
  idea: GeoIdea;
  onClose: () => void;
  onLikeToggle: (idea: GeoIdea) => void;
  onRequireAuth: () => void;
  onCenterOnMap: (idea: GeoIdea) => void;
  onRefreshIdea?: () => void;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  onClose,
  onLikeToggle,
  onRequireAuth,
  onCenterOnMap,
  onRefreshIdea
}) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationComment, setVerificationComment] = useState('');
  const [showVerifyInput, setShowVerifyInput] = useState(false);

  // Government Status Management
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus>(idea.status || 'submitted');
  const [deptAssigned, setDeptAssigned] = useState(idea.departmentAssigned || '');
  const [officialName, setOfficialName] = useState(idea.assignedOfficialName || user?.name || '');
  const [resolutionNotes, setResolutionNotes] = useState(idea.resolutionNotes || '');
  const [resolutionImage, setResolutionImage] = useState(idea.resolutionImageUrl || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // AI Translation state
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const isOfficialOrAdmin = user?.role === 'official' || user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoadingComments(true);
        const data = await api.getComments(idea.id);
        setComments(data);
      } catch (err: any) {
        console.error('Failed loading comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
    fetchComments();
  }, [idea.id]);

  const handleVerify = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg('');
      const res = await api.verifyIdea(idea.id, verificationComment.trim() || undefined);
      idea.verificationsCount = res.verificationsCount;
      idea.isVerifiedByUser = res.isVerifiedByUser;
      idea.status = res.currentStatus;
      setShowVerifyInput(false);
      setVerificationComment('');
      if (onRefreshIdea) onRefreshIdea();
    } catch (e: any) {
      setErrorMsg(e.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      setErrorMsg('');
      const res = await api.updateStatus(idea.id, {
        status: newStatus,
        departmentAssigned: deptAssigned.trim() || undefined,
        assignedOfficialName: officialName.trim() || undefined,
        resolutionNotes: resolutionNotes.trim() || undefined,
        resolutionImageUrl: resolutionImage.trim() || undefined
      });

      Object.assign(idea, res.idea);
      setShowStatusPanel(false);
      if (onRefreshIdea) onRefreshIdea();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed updating status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (targetLang === 'en') {
      setTranslatedTitle('');
      setTranslatedDesc('');
      setCurrentLang('en');
      return;
    }

    try {
      setIsTranslating(true);
      setCurrentLang(targetLang);

      const [resTitle, resDesc] = await Promise.all([
        api.translateText({ text: idea.title, targetLang }),
        api.translateText({ text: idea.description, targetLang })
      ]);

      setTranslatedTitle(resTitle.translatedText);
      setTranslatedDesc(resDesc.translatedText);
    } catch (e) {
      setErrorMsg('Translation unavailable.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      const created = await api.addComment(idea.id, newCommentText.trim());
      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      idea.commentsCount += 1;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed posting comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      idea.commentsCount = Math.max(0, idea.commentsCount - 1);
    } catch (err: any) {
      console.error('Failed deleting comment:', err);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
              {idea.category}
            </span>
            {idea.severity && (
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full uppercase">
                🔥 {idea.severity}
              </span>
            )}
            {idea.status && (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-full uppercase">
                ⚙️ {idea.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Translation Dropdown */}
            <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <select
                id="translate-modal-select"
                value={currentLang}
                onChange={(e) => handleTranslate(e.target.value)}
                disabled={isTranslating}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="en">Translate: English</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="hi">हिंदी (HI)</option>
              </select>
            </div>

            <button
              id="share-idea-btn"
              onClick={handleCopyShareLink}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-full transition-colors"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              id="close-idea-detail-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copiedLink && (
          <div className="bg-emerald-600 text-white text-xs font-medium py-1.5 text-center animate-in fade-in">
            Link copied to clipboard!
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Cover Image if available */}
          {idea.imageUrl && (
            <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
              <img src={idea.imageUrl} alt={idea.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title & Author Info */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-3">
              {translatedTitle || idea.title}
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={idea.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt={idea.userName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{idea.userName}</p>
                  <p className="text-slate-400 text-xs">Citizen Reporter</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Posted {new Date(idea.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Description Text */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {isTranslating ? (
              <span className="animate-pulse text-slate-400">Translating text using Gemini AI...</span>
            ) : (
              translatedDesc || idea.description
            )}
          </div>

          {/* Resolution Proof Banner if resolved */}
          {idea.resolutionNotes && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Government Resolution Official Record</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-line">{idea.resolutionNotes}</p>
              {idea.resolutionImageUrl && (
                <img
                  src={idea.resolutionImageUrl}
                  alt="Resolution proof"
                  className="w-full max-h-48 object-cover rounded-xl mt-2 border border-emerald-200"
                />
              )}
            </div>
          )}

          {/* Government / Official Resolution Drawer Button */}
          {isOfficialOrAdmin && (
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-700" />
                  <span className="font-bold text-sky-900 text-sm">Official Resolution Control</span>
                </div>
                <button
                  type="button"
                  id="toggle-status-panel-btn"
                  onClick={() => setShowStatusPanel(!showStatusPanel)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  {showStatusPanel ? 'Hide Panel' : 'Update Status & Assign'}
                </button>
              </div>

              {showStatusPanel && (
                <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2 border-t border-sky-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1">Status Phase</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                        className="w-full px-3 py-1.5 bg-white rounded-xl text-xs font-bold border border-sky-200"
                      >
                        <option value="submitted">Submitted 📝</option>
                        <option value="verified">Verified ✅</option>
                        <option value="under_review">Under Review 🔍</option>
                        <option value="assigned">Assigned to Dept 🏛️</option>
                        <option value="in_progress">In Progress 🚧</option>
                        <option value="resolved">Resolved 🎉</option>
                        <option value="closed">Closed 📁</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g., Chennai Public Works Dept"
                        value={deptAssigned}
                        onChange={(e) => setDeptAssigned(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white rounded-xl text-xs border border-sky-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sky-900 mb-1">Official Resolution Notes / Proof</label>
                    <textarea
                      rows={2}
                      placeholder="Enter work details, action taken, resolution completion notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-xl text-xs border border-sky-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    {updatingStatus ? 'Saving Status...' : 'Save Official Resolution Record'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Location & Coordinates Box */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{idea.address || 'Geo Coordinates'}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Lat: {idea.latitude.toFixed(4)}, Lng: {idea.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            <button
              id="locate-on-map-btn"
              onClick={() => {
                onCenterOnMap(idea);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white font-semibold text-xs rounded-xl border border-emerald-200 shadow-xs transition-all"
            >
              <Compass className="w-4 h-4" />
              Focus on Map
            </button>
          </div>

          {/* Upvote & Ground Verification Action Bar */}
          <div className="flex items-center justify-between py-2 border-y border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                id={`modal-like-btn-${idea.id}`}
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireAuth();
                  } else {
                    onLikeToggle(idea);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idea.isLikedByUser
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${idea.isLikedByUser ? 'fill-white' : ''}`} />
                <span>{idea.isLikedByUser ? 'Upvoted!' : 'Upvote'}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {idea.likesCount}
                </span>
              </button>

              <button
                id={`modal-verify-btn-${idea.id}`}
                onClick={() => setShowVerifyInput(!showVerifyInput)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idea.isVerifiedByUser
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{idea.isVerifiedByUser ? 'Verified On Site' : 'Verify Issue On Ground'}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-200/50 text-xs">
                  {idea.verificationsCount || 0}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>{idea.commentsCount} Community Comments</span>
            </div>
          </div>

          {/* Verify On Ground Input Form */}
          {showVerifyInput && (
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2 animate-in fade-in">
              <p className="font-bold text-blue-900 text-xs">Confirm Community On-Site Verification</p>
              <input
                type="text"
                placeholder="Optional notes (e.g. 'I visited Anna Salai today and confirmed this pothole is present')"
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl text-xs border border-blue-200"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                {verifying ? 'Submitting Verification...' : 'Submit Ground Verification (+15 Civic Pts)'}
              </button>
            </div>
          )}

          {/* Status History Timeline */}
          {idea.statusHistory && idea.statusHistory.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Audit Trail & Status History Timeline
              </h3>
              <div className="relative border-l-2 border-emerald-200 ml-3 pl-4 space-y-3">
                {idea.statusHistory.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="uppercase text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {hist.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{hist.notes || `Updated status by ${hist.updatedBy}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Section */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Discussion & Community Feedback
            </h3>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                id="comment-input-field"
                type="text"
                placeholder={
                  isAuthenticated
                    ? 'Write a helpful comment or suggestion...'
                    : 'Sign in to join the discussion...'
                }
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                id="submit-comment-btn"
                type="submit"
                disabled={submitting || !newCommentText.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            {/* Comment List */}
            {loadingComments ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                Loading community comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No comments yet. Be the first to share feedback on this idea!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={comment.userName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-800">{comment.userName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {user?.id === comment.userId && (
                        <button
                          id={`delete-comment-${comment.id}`}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm pt-1">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

