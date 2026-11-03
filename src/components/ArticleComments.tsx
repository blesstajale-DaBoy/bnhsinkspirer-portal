import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Heart,
  User,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { ArticleComment } from '../types';

interface ArticleCommentsProps {
  articleId: string;
  articleTitle: string;
}

const STORAGE_KEY = 'the_inkspirer_comments_v1';

// Seed comments so every article has genuine campus dialogue upon first load
const SEED_COMMENTS: Record<string, ArticleComment[]> = {
  'story-1': [
    {
      id: 'c-seed-1',
      articleId: 'story-1',
      authorName: 'Angelica R. Morales',
      authorRole: 'Grade 12 HUMSS · Student Council',
      message:
        'Barobo National High School continues to raise the bar! Huge congratulations to our campus journalists for bagging top division awards. Proud BNHSian here!',
      createdAt: '2026-10-24T09:30:00.000Z',
      likes: 14,
    },
    {
      id: 'c-seed-2',
      articleId: 'story-1',
      authorName: 'Mr. Roland P. Cañedo',
      authorRole: 'Faculty · English Department',
      message:
        'A well-researched article that highlights the true essence of campus journalism under RA 7079. Kudos to The Inkspirer editorial board for leading with integrity.',
      createdAt: '2026-10-24T14:15:00.000Z',
      likes: 9,
    },
  ],
  'story-2': [
    {
      id: 'c-seed-3',
      articleId: 'story-2',
      authorName: 'Christian Jay P.',
      authorRole: 'Grade 10 · BNHS Rams Fan Club',
      message:
        'What a thrilling final quarter! That buzzer-beater shot gave everyone in the gymnasium goosebumps. On to the Division Meet!',
      createdAt: '2026-10-23T16:45:00.000Z',
      likes: 18,
    },
  ],
  'story-3': [
    {
      id: 'c-seed-4',
      articleId: 'story-3',
      authorName: 'Ma. Elena D. Santos',
      authorRole: 'BNHS PTA Officer',
      message:
        'Commendable initiative on modernizing the school laboratory and digital library. Our students deserve every resource to excel globally.',
      createdAt: '2026-10-22T11:20:00.000Z',
      likes: 11,
    },
  ],
};

export const ArticleComments: React.FC<ArticleCommentsProps> = ({
  articleId,
  articleTitle,
}) => {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Student');
  const [customRole, setCustomRole] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  // Load comments from localStorage and merge with seeds
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let allStoredComments: ArticleComment[] = [];
      if (stored) {
        allStoredComments = JSON.parse(stored);
      }

      // Filter for this article
      const articleStored = allStoredComments.filter((c) => c.articleId === articleId);

      // Check if we need seed comments for this article if no user comments exist yet
      if (articleStored.length === 0 && SEED_COMMENTS[articleId]) {
        setComments(SEED_COMMENTS[articleId]);
      } else if (articleStored.length > 0) {
        // Also merge seeds if not duplicate
        const seedList = SEED_COMMENTS[articleId] || [];
        const mergedMap = new Map<string, ArticleComment>();
        [...seedList, ...articleStored].forEach((item) => mergedMap.set(item.id, item));
        setComments(Array.from(mergedMap.values()));
      } else {
        setComments([]);
      }
    } catch {
      setComments(SEED_COMMENTS[articleId] || []);
    }
  }, [articleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const finalRole =
      authorRole === 'Other'
        ? (customRole.trim() || 'Reader')
        : authorRole;

    const newComment: ArticleComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      articleId,
      authorName: authorName.trim(),
      authorRole: finalRole,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setTimeout(() => {
      // Update state
      const updatedList = [newComment, ...comments];
      setComments(updatedList);

      // Save to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const allStored: ArticleComment[] = stored ? JSON.parse(stored) : [];
        allStored.unshift(newComment);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allStored));
      } catch (err) {
        console.error('Failed to save comment locally', err);
      }

      setMessage('');
      setIsSubmitting(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    }, 300);
  };

  const handleToggleLike = (commentId: string) => {
    const isLiked = likedCommentIds.has(commentId);
    const nextSet = new Set(likedCommentIds);

    if (isLiked) {
      nextSet.delete(commentId);
    } else {
      nextSet.add(commentId);
    }
    setLikedCommentIds(nextSet);

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
          };
        }
        return c;
      })
    );
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name[0] || 'U').toUpperCase();
  };

  return (
    <section className="mt-12 pt-8 border-t-2 border-stone-200">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20">
            <MessageSquare className="w-5 h-5 text-[#4A0E17]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <span>Reader Discussion</span>
              <span className="text-sm font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#3B0910] border border-[#D4AF37]/50">
                {comments.length}
              </span>
            </h2>
            <p className="text-xs text-stone-600">
              Share your insights, constructive feedback, and thoughts on this story
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="mb-6 p-3.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Thank you! Your comment has been posted to this story.
          </span>
        </div>
      )}

      {/* Comment Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-stone-200 p-5 sm:p-6 mb-8 shadow-xs focus-within:border-[#4A0E17] transition-colors"
      >
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-[#4A0E17]">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Leave a Comment on this Story</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Author Name */}
          <div>
            <label
              htmlFor="commenter-name"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Your Name / Alias <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="commenter-name"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full text-sm px-3 py-2 pl-9 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Reader Affiliation / Role */}
          <div>
            <label
              htmlFor="commenter-role"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Affiliation with BNHS
            </label>
            <select
              id="commenter-role"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50 text-stone-800"
            >
              <option value="Senior High Student">Senior High Student (Grades 11-12)</option>
              <option value="Junior High Student">Junior High Student (Grades 7-10)</option>
              <option value="Faculty & Staff">Faculty & Staff</option>
              <option value="Alumni">Barobo NHS Alumni</option>
              <option value="Parent / Guardian">Parent / Guardian (PTA)</option>
              <option value="Community Reader">Barobo Community Reader</option>
              <option value="Other">Other / Custom</option>
            </select>
          </div>
        </div>

        {/* Custom Role Input if Other */}
        {authorRole === 'Other' && (
          <div className="mb-4">
            <label
              htmlFor="custom-role"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Specify Your Designation or Section
            </label>
            <input
              id="custom-role"
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g., Grade 10 - Rizal / Visitor"
              className="w-full text-sm px-3 py-2 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] bg-stone-50"
            />
          </div>
        )}

        {/* Comment Message */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="comment-message"
              className="block text-xs font-semibold text-stone-700"
            >
              Comment Message <span className="text-rose-600">*</span>
            </label>
            <span className="text-[11px] text-stone-400">
              {message.length}/1000 characters
            </span>
          </div>
          <textarea
            id="comment-message"
            required
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`What are your thoughts on "${articleTitle}"? Write with respect and constructive feedback.`}
            className="w-full text-sm p-3 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50 text-stone-800 leading-relaxed resize-y min-h-[80px]"
          />
        </div>

        {/* Ethics Disclaimer & Submit Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-stone-500 leading-tight flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Comments uphold campus journalism decorum & student free expression.</span>
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !authorName.trim() || !message.trim()}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded bg-[#4A0E17] text-white hover:bg-[#60121F] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed border-stone-300 p-6">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">No comments yet</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Be the first reader to share your insights on this Barobo National High School story!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isLiked = likedCommentIds.has(comment.id);
            const initials = getInitials(comment.authorName);

            return (
              <article
                key={comment.id}
                className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5 shadow-2xs hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar Icon */}
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#4A0E17] to-[#781B2B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-[#D4AF37]/40">
                    {initials}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {comment.authorName}
                        </span>
                        {comment.authorRole && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-[#4A0E17] border border-stone-200">
                            {comment.authorRole}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(comment.createdAt)}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mt-2">
                      {comment.message}
                    </p>

                    {/* Like Action */}
                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center gap-4 text-xs">
                      <button
                        onClick={() => handleToggleLike(comment.id)}
                        className={`inline-flex items-center gap-1.5 transition-colors ${
                          isLiked
                            ? 'text-rose-600 font-bold'
                            : 'text-stone-500 hover:text-rose-600'
                        }`}
                        title={isLiked ? 'Unlike comment' : 'Like comment'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-rose-600 text-rose-600' : ''
                          }`}
                        />
                        <span>
                          {comment.likes > 0 ? `${comment.likes} Like${comment.likes === 1 ? '' : 's'}` : 'Like'}
                        </span>
                      </button>

                      <span className="text-stone-300" aria-hidden="true">·</span>

                      <span className="text-[11px] text-stone-400">
                        The Inkspirer Reader Voice
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
