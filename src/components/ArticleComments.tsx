import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Heart,
  User,
  CheckCircle2,
  ShieldAlert,
  Clock,
  GraduationCap,
  Award,
  CornerDownRight,
  Trash2,
  ShieldCheck,
  ArrowUpDown,
  X,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, OperationType, buildFirestoreErrorInfo } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ArticleComment } from '../types';

interface ArticleCommentsProps {
  articleId: string;
  articleTitle: string;
  onCommentCountChange?: (count: number) => void;
}

const STORAGE_KEY = 'the_inkspirer_comments_v2';
const LIKED_COMMENTS_KEY = 'the_inkspirer_liked_comments_v1';
const MY_COMMENTS_KEY = 'the_inkspirer_my_comments_v1';

type AffiliationOption =
  | 'Senior High Student'
  | 'Junior High Student'
  | 'Faculty & Staff'
  | 'School Administration'
  | 'Parent / Guardian'
  | 'Alumni'
  | 'Community Reader';

const AFFILIATION_OPTIONS: {
  value: AffiliationOption;
  label: string;
  group: 'student' | 'faculty' | 'community';
  detailPlaceholder: string;
}[] = [
  {
    value: 'Senior High Student',
    label: 'Senior High Student (Grades 11–12)',
    group: 'student',
    detailPlaceholder: 'e.g., Grade 12 HUMSS / STEM',
  },
  {
    value: 'Junior High Student',
    label: 'Junior High Student (Grades 7–10)',
    group: 'student',
    detailPlaceholder: 'e.g., Grade 10 – Rizal',
  },
  {
    value: 'Faculty & Staff',
    label: 'Faculty & Teaching Staff',
    group: 'faculty',
    detailPlaceholder: 'e.g., English Dept. / Master Teacher',
  },
  {
    value: 'School Administration',
    label: 'School Administration / Adviser',
    group: 'faculty',
    detailPlaceholder: 'e.g., Department Head / Office',
  },
  {
    value: 'Parent / Guardian',
    label: 'Parent / Guardian (PTA)',
    group: 'community',
    detailPlaceholder: 'e.g., PTA Officer / Grade 11 Parent',
  },
  {
    value: 'Alumni',
    label: 'Barobo NHS Alumni',
    group: 'community',
    detailPlaceholder: 'e.g., Batch 2022',
  },
  {
    value: 'Community Reader',
    label: 'Barobo Community Reader',
    group: 'community',
    detailPlaceholder: 'Optional affiliation or barangay',
  },
];

function inferAuthorGroup(comment: Pick<ArticleComment, 'authorGroup' | 'authorRole'>): 'student' | 'faculty' | 'community' {
  if (comment.authorGroup) return comment.authorGroup;
  const role = (comment.authorRole || '').toLowerCase();
  if (
    role.includes('faculty') ||
    role.includes('teacher') ||
    role.includes('adviser') ||
    role.includes('principal') ||
    role.includes('admin') ||
    role.includes('staff') ||
    role.includes('dept')
  ) {
    return 'faculty';
  }
  if (
    role.includes('student') ||
    role.includes('grade') ||
    role.includes('humss') ||
    role.includes('stem') ||
    role.includes('abm') ||
    role.includes('tvl') ||
    role.includes('junior high') ||
    role.includes('senior high')
  ) {
    return 'student';
  }
  return 'community';
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

function getGroupFromAffiliation(affiliation: AffiliationOption): 'student' | 'faculty' | 'community' {
  const found = AFFILIATION_OPTIONS.find((opt) => opt.value === affiliation);
  return found ? found.group : 'community';
}

export const ArticleComments: React.FC<ArticleCommentsProps> = ({
  articleId,
  articleTitle,
  onCommentCountChange,
}) => {
  const { userProfile, isAuthorizedStaff } = useAuth();

  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Composer form state
  const [authorName, setAuthorName] = useState('');
  const [affiliation, setAffiliation] = useState<AffiliationOption>('Senior High Student');
  const [sectionOrDept, setSectionOrDept] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Filtering, sorting & deletion confirmation
  const [filterGroup, setFilterGroup] = useState<'all' | 'student' | 'faculty'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Persisted local user interactions
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(readLocalJson<string[]>(LIKED_COMMENTS_KEY, []))
  );
  const [myCommentIds, setMyCommentIds] = useState<Set<string>>(
    () => new Set(readLocalJson<string[]>(MY_COMMENTS_KEY, []))
  );

  // Auto-prefill commenter identity when signed in as adviser/editor/reader
  useEffect(() => {
    if (!userProfile) return;
    if (!authorName.trim() && userProfile.displayName) {
      setAuthorName(userProfile.displayName);
    }
    if (userProfile.role === 'adviser') {
      setAffiliation('Faculty & Staff');
      if (!sectionOrDept.trim() && userProfile.designation) {
        setSectionOrDept(userProfile.designation);
      }
    } else if (userProfile.role === 'editor' || userProfile.role === 'contributor') {
      setAffiliation('Senior High Student');
      if (!sectionOrDept.trim() && userProfile.designation) {
        setSectionOrDept(userProfile.designation);
      }
    }
  }, [userProfile]);

  // Real-time Cloud Firestore subscription for comments on this article
  useEffect(() => {
    setIsLoading(true);
    setReplyingToId(null);
    setPendingDeleteId(null);

    // Load cached local comments first for instant render
    const cachedAll = readLocalJson<ArticleComment[]>(STORAGE_KEY, []);
    const cachedForArticle = cachedAll.filter((c) => c.articleId === articleId);
    if (cachedForArticle.length > 0) {
      setComments(cachedForArticle);
    } else {
      setComments([]);
    }

    const commentsQuery = query(
      collection(db, 'comments'),
      where('articleId', '==', articleId)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const cloudComments: ArticleComment[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: typeof data.id === 'string' && data.id ? data.id : docSnap.id,
            articleId: String(data.articleId || articleId),
            authorName: String(data.authorName || 'Campus Reader'),
            authorRole: typeof data.authorRole === 'string' ? data.authorRole : undefined,
            authorGroup:
              data.authorGroup === 'student' ||
              data.authorGroup === 'faculty' ||
              data.authorGroup === 'community'
                ? data.authorGroup
                : undefined,
            parentId: typeof data.parentId === 'string' && data.parentId ? data.parentId : undefined,
            isEditorialStaff: Boolean(data.isEditorialStaff),
            message: String(data.message || ''),
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            likes: typeof data.likes === 'number' && Number.isFinite(data.likes) ? data.likes : 0,
          };
        });

        setComments(cloudComments);
        setIsLoading(false);

        // Keep local cache in sync for this article
        const existingAll = readLocalJson<ArticleComment[]>(STORAGE_KEY, []);
        const otherArticles = existingAll.filter((c) => c.articleId !== articleId);
        writeLocalJson(STORAGE_KEY, [...cloudComments, ...otherArticles].slice(0, 300));
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(error, OperationType.LIST, 'comments');
        console.warn('Firestore comments subscription warning:', JSON.stringify(errInfo));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [articleId]);

  // Notify parent ArticleReaderModal whenever the total comment count updates
  useEffect(() => {
    onCommentCountChange?.(comments.length);
  }, [comments.length, onCommentCountChange]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const buildCommentRoleLabel = () => {
    const trimmedDetail = sectionOrDept.trim();
    const combined = trimmedDetail ? `${affiliation} · ${trimmedDetail}` : affiliation;
    return combined.slice(0, 128);
  };

  const saveComment = async (text: string, parentId?: string) => {
    const trimmedName = authorName.trim().slice(0, 128);
    const trimmedMessage = text.trim().slice(0, 1000);
    if (!trimmedName || !trimmedMessage) {
      setErrorMessage('Please enter your name and comment before posting.');
      return false;
    }

    setErrorMessage(null);
    const newId = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const authorGroup = getGroupFromAffiliation(affiliation);

    const newComment: ArticleComment = {
      id: newId,
      articleId: articleId.slice(0, 128),
      authorName: trimmedName,
      authorRole: buildCommentRoleLabel(),
      authorGroup,
      ...(parentId ? { parentId: parentId.slice(0, 128) } : {}),
      ...(isAuthorizedStaff ? { isEditorialStaff: true } : {}),
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    // Optimistic UI update + local cache
    setComments((prev) => [newComment, ...prev.filter((c) => c.id !== newId)]);
    const updatedMine = new Set(myCommentIds);
    updatedMine.add(newId);
    setMyCommentIds(updatedMine);
    writeLocalJson(MY_COMMENTS_KEY, Array.from(updatedMine));

    const existingAll = readLocalJson<ArticleComment[]>(STORAGE_KEY, []);
    writeLocalJson(STORAGE_KEY, [newComment, ...existingAll.filter((c) => c.id !== newId)].slice(0, 300));

    // Persist to Cloud Firestore
    try {
      await setDoc(doc(db, 'comments', newId), newComment);
    } catch (error) {
      const errInfo = buildFirestoreErrorInfo(error, OperationType.CREATE, `comments/${newId}`);
      console.error('Firestore comment create error:', JSON.stringify(errInfo));
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ok = await saveComment(message);
      if (ok) {
        setMessage('');
        showToast('Thank you! Your feedback has been posted to this article.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyMessage.trim() || isSubmittingReply) return;
    if (!authorName.trim()) {
      setErrorMessage('Please enter your name in the comment form above before posting a reply.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const ok = await saveComment(replyMessage, parentId);
      if (ok) {
        setReplyMessage('');
        setReplyingToId(null);
        showToast('Your reply has been added to the discussion.');
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleLike = async (comment: ArticleComment) => {
    const isAlreadyLiked = likedCommentIds.has(comment.id);
    const nextLikes = isAlreadyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1;

    const nextLikedSet = new Set(likedCommentIds);
    if (isAlreadyLiked) {
      nextLikedSet.delete(comment.id);
    } else {
      nextLikedSet.add(comment.id);
    }
    setLikedCommentIds(nextLikedSet);
    writeLocalJson(LIKED_COMMENTS_KEY, Array.from(nextLikedSet));

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, likes: nextLikes } : c))
    );

    try {
      await updateDoc(doc(db, 'comments', comment.id), { likes: nextLikes });
    } catch (error) {
      const errInfo = buildFirestoreErrorInfo(error, OperationType.UPDATE, `comments/${comment.id}`);
      console.warn('Firestore comment like update warning:', JSON.stringify(errInfo));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const childReplyIds = comments
      .filter((c) => c.parentId === commentId)
      .map((c) => c.id);
    const idsToRemove = [commentId, ...childReplyIds];

    setComments((prev) => prev.filter((c) => !idsToRemove.includes(c.id)));
    setPendingDeleteId(null);

    const existingAll = readLocalJson<ArticleComment[]>(STORAGE_KEY, []);
    writeLocalJson(
      STORAGE_KEY,
      existingAll.filter((c) => !idsToRemove.includes(c.id))
    );

    for (const id of idsToRemove) {
      try {
        await deleteDoc(doc(db, 'comments', id));
      } catch (error) {
        const errInfo = buildFirestoreErrorInfo(error, OperationType.DELETE, `comments/${id}`);
        console.warn('Firestore comment delete warning:', JSON.stringify(errInfo));
      }
    }

    showToast('Comment removed from the discussion.');
  };

  // Group comments into top-level threads and replies, with group counts
  const { topLevelComments, repliesByParent, groupCounts } = useMemo(() => {
    const byId = new Set(comments.map((c) => c.id));
    const repliesMap = new Map<string, ArticleComment[]>();
    const roots: ArticleComment[] = [];

    let studentCount = 0;
    let facultyCount = 0;

    comments.forEach((c) => {
      const grp = inferAuthorGroup(c);
      if (grp === 'student') studentCount += 1;
      if (grp === 'faculty') facultyCount += 1;

      if (c.parentId && byId.has(c.parentId)) {
        const list = repliesMap.get(c.parentId) || [];
        list.push(c);
        repliesMap.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    });

    // Sort replies oldest-first so conversations read naturally top-to-bottom
    repliesMap.forEach((list, parentId) => {
      repliesMap.set(
        parentId,
        [...list].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    });

    // Filter top-level threads (keep thread if parent or any reply matches selected group)
    const filteredRoots = roots.filter((root) => {
      if (filterGroup === 'all') return true;
      if (inferAuthorGroup(root) === filterGroup) return true;
      const childReplies = repliesMap.get(root.id) || [];
      return childReplies.some((r) => inferAuthorGroup(r) === filterGroup);
    });

    // Sort top-level threads
    const sortedRoots = [...filteredRoots].sort((a, b) => {
      if (sortBy === 'popular') {
        if (b.likes !== a.likes) return b.likes - a.likes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      topLevelComments: sortedRoots,
      repliesByParent: repliesMap,
      groupCounts: {
        all: comments.length,
        student: studentCount,
        faculty: facultyCount,
      },
    };
  }, [comments, filterGroup, sortBy]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return 'Just now';
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

  const selectedAffiliationConfig =
    AFFILIATION_OPTIONS.find((opt) => opt.value === affiliation) || AFFILIATION_OPTIONS[0];

  const renderRoleBadge = (comment: ArticleComment) => {
    const group = inferAuthorGroup(comment);
    const badgeStyles =
      group === 'faculty'
        ? 'bg-[#0B2545]/10 text-[#0B2545] border-[#0B2545]/25'
        : group === 'student'
        ? 'bg-[#4A0E17]/10 text-[#4A0E17] border-[#4A0E17]/20'
        : 'bg-stone-100 text-stone-700 border-stone-200';

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {comment.authorRole && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeStyles}`}
          >
            {group === 'faculty' ? (
              <Award className="w-3 h-3 shrink-0" />
            ) : group === 'student' ? (
              <GraduationCap className="w-3 h-3 shrink-0" />
            ) : null}
            <span>{comment.authorRole}</span>
          </span>
        )}
        {comment.isEditorialStaff && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#3B0910] border border-[#D4AF37]/60">
            <ShieldCheck className="w-3 h-3 text-[#4A0E17]" />
            <span>Editorial Board</span>
          </span>
        )}
      </div>
    );
  };

  const renderAvatar = (comment: ArticleComment, small = false) => {
    const group = inferAuthorGroup(comment);
    const sizeClasses = small ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
    const colorClasses =
      group === 'faculty'
        ? 'bg-linear-to-br from-[#0B2545] to-[#133E87] text-[#F3C562] border-[#D4AF37]/50'
        : 'bg-linear-to-br from-[#4A0E17] to-[#781B2B] text-[#F3C562] border-[#D4AF37]/40';

    return (
      <div
        className={`${sizeClasses} ${colorClasses} rounded-full font-bold flex items-center justify-center shrink-0 shadow-2xs border`}
      >
        {getInitials(comment.authorName)}
      </div>
    );
  };

  const canDeleteComment = (commentId: string) =>
    isAuthorizedStaff || myCommentIds.has(commentId);

  return (
    <section
      id="article-comments-section"
      aria-label="Student and Faculty Comments"
      className="mt-10 pt-8 border-t-2 border-stone-200"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#4A0E17] text-[#F3C562] border border-[#D4AF37]/50 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <span>Campus Feedback & Discussion</span>
              <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/25 text-[#3B0910] border border-[#D4AF37]/60 tabular-nums">
                {comments.length}
              </span>
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Students, faculty, and BNHS readers can share reactions, questions, and constructive feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {toastMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm flex items-center justify-between gap-2.5">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comment Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-stone-200 p-5 sm:p-6 mb-7 shadow-xs focus-within:border-[#4A0E17] transition-colors"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A0E17]">
            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Share Your Feedback on This Story</span>
          </div>
          {isAuthorizedStaff && userProfile?.displayName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A0E17] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/40">
              <ShieldCheck className="w-3 h-3" />
              Posting as {userProfile.displayName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          {/* Author Name */}
          <div>
            <label
              htmlFor="commenter-name"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Your Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="commenter-name"
                type="text"
                required
                maxLength={128}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g., Maria Santos"
                className="w-full text-sm px-3 py-2 pl-9 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Student / Faculty Affiliation */}
          <div>
            <label
              htmlFor="commenter-role"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Role / Affiliation
            </label>
            <select
              id="commenter-role"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value as AffiliationOption)}
              className="w-full text-sm px-3 py-2 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50 text-stone-800"
            >
              {AFFILIATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Grade & Section / Department */}
          <div>
            <label
              htmlFor="commenter-detail"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              {selectedAffiliationConfig.group === 'faculty'
                ? 'Department / Position'
                : selectedAffiliationConfig.group === 'student'
                ? 'Grade & Section'
                : 'Details (Optional)'}
            </label>
            <input
              id="commenter-detail"
              type="text"
              maxLength={64}
              value={sectionOrDept}
              onChange={(e) => setSectionOrDept(e.target.value)}
              placeholder={selectedAffiliationConfig.detailPlaceholder}
              className="w-full text-sm px-3 py-2 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50"
            />
          </div>
        </div>

        {/* Comment Message */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="comment-message"
              className="block text-xs font-semibold text-stone-700"
            >
              Your Comment or Feedback <span className="text-rose-600">*</span>
            </label>
            <span className="text-[11px] text-stone-400 tabular-nums">
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
            placeholder={`Share your perspective or feedback on "${articleTitle}"...`}
            className="w-full text-sm p-3 rounded border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17] bg-stone-50 text-stone-800 leading-relaxed resize-y min-h-[84px]"
          />
        </div>

        {/* Ethics Reminder & Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-stone-500 leading-tight flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Keep feedback respectful and constructive in the spirit of campus journalism.</span>
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !authorName.trim() || !message.trim()}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded bg-[#4A0E17] text-white hover:bg-[#60121F] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isSubmitting ? 'Posting...' : 'Post Feedback'}</span>
          </button>
        </div>
      </form>

      {/* Filter & Sort Controls */}
      {comments.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterGroup('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors border cursor-pointer ${
                filterGroup === 'all'
                  ? 'bg-[#4A0E17] text-white border-[#4A0E17]'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              All ({groupCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterGroup('student')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors border inline-flex items-center gap-1.5 cursor-pointer ${
                filterGroup === 'student'
                  ? 'bg-[#4A0E17] text-white border-[#4A0E17]'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Students ({groupCounts.student})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterGroup('faculty')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors border inline-flex items-center gap-1.5 cursor-pointer ${
                filterGroup === 'faculty'
                  ? 'bg-[#0B2545] text-white border-[#0B2545]'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Faculty ({groupCounts.faculty})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              aria-label="Sort comments"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
              className="text-xs font-medium bg-white border border-stone-200 rounded px-2.5 py-1 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Liked</option>
            </select>
          </div>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-stone-200 p-6">
            <p className="text-xs text-stone-500">Loading campus discussion...</p>
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed border-stone-300 p-6">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">
              {comments.length === 0
                ? 'No comments yet'
                : `No ${filterGroup} comments on this article yet`}
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {comments.length === 0
                ? 'Be the first student or faculty member to share your feedback on this story.'
                : 'Switch back to All comments or start the conversation above.'}
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const isLiked = likedCommentIds.has(comment.id);
            const replies = repliesByParent.get(comment.id) || [];
            const isReplyingHere = replyingToId === comment.id;
            const isConfirmingDelete = pendingDeleteId === comment.id;

            return (
              <article
                key={comment.id}
                className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5 shadow-2xs hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {renderAvatar(comment)}

                  <div className="flex-1 min-w-0">
                    {/* Header: Name, Role Badge, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {comment.authorName}
                        </span>
                        {renderRoleBadge(comment)}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(comment.createdAt)}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mt-2 break-words">
                      {comment.message}
                    </p>

                    {/* Actions Row: Like, Reply, Delete */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(comment)}
                          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                          <span className="tabular-nums">
                            {comment.likes > 0
                              ? `${comment.likes} Like${comment.likes === 1 ? '' : 's'}`
                              : 'Like'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(isReplyingHere ? null : comment.id);
                            setReplyMessage('');
                          }}
                          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isReplyingHere
                              ? 'text-[#4A0E17] font-bold'
                              : 'text-stone-500 hover:text-[#4A0E17]'
                          }`}
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>
                            {isReplyingHere
                              ? 'Cancel Reply'
                              : replies.length > 0
                              ? `Reply (${replies.length})`
                              : 'Reply'}
                          </span>
                        </button>
                      </div>

                      {canDeleteComment(comment.id) && (
                        <div className="flex items-center gap-2">
                          {isConfirmingDelete ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(null)}
                                className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium text-[11px] hover:bg-stone-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(comment.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Reply Composer */}
                    {isReplyingHere && (
                      <form
                        onSubmit={(e) => handleReplySubmit(e, comment.id)}
                        className="mt-3 p-3 rounded-md bg-stone-50 border border-stone-200 space-y-2.5"
                      >
                        {!authorName.trim() && (
                          <div>
                            <label
                              htmlFor={`reply-name-${comment.id}`}
                              className="block text-[11px] font-semibold text-stone-600 mb-1"
                            >
                              Your Name <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id={`reply-name-${comment.id}`}
                              type="text"
                              required
                              maxLength={128}
                              value={authorName}
                              onChange={(e) => setAuthorName(e.target.value)}
                              placeholder="Enter your name"
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
                            />
                          </div>
                        )}
                        <div>
                          <textarea
                            rows={2}
                            required
                            maxLength={1000}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={`Reply to ${comment.authorName}...`}
                            className="w-full text-xs p-2.5 rounded border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] resize-y"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-stone-500">
                            Replying as{' '}
                            <strong className="text-stone-700">
                              {authorName.trim() || 'Guest'}
                            </strong>{' '}
                            ({affiliation})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyMessage('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReply || !replyMessage.trim() || !authorName.trim()}
                              className="px-3 py-1.5 rounded bg-[#4A0E17] text-white text-[11px] font-bold hover:bg-[#60121F] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-[#D4AF37]" />
                              <span>{isSubmittingReply ? 'Sending...' : 'Post Reply'}</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Threaded Replies */}
                    {replies.length > 0 && (
                      <div className="mt-3.5 pl-3.5 sm:pl-4 border-l-2 border-[#D4AF37]/60 space-y-3">
                        {replies.map((reply) => {
                          const isReplyLiked = likedCommentIds.has(reply.id);
                          const isConfirmingReplyDelete = pendingDeleteId === reply.id;

                          return (
                            <div
                              key={reply.id}
                              className="bg-[#FBF9F5] rounded-md border border-stone-200/80 p-3"
                            >
                              <div className="flex items-start gap-2.5">
                                {renderAvatar(reply, true)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-xs text-stone-900">
                                        {reply.authorName}
                                      </span>
                                      {renderRoleBadge(reply)}
                                    </div>
                                    <span className="text-[10px] text-stone-400">
                                      {formatTimestamp(reply.createdAt)}
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mt-1.5 break-words">
                                    {reply.message}
                                  </p>

                                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLike(reply)}
                                      className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                        isReplyLiked
                                          ? 'text-rose-600 font-bold'
                                          : 'text-stone-500 hover:text-rose-600'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 ${
                                          isReplyLiked ? 'fill-rose-600 text-rose-600' : ''
                                        }`}
                                      />
                                      <span className="tabular-nums">
                                        {reply.likes > 0 ? reply.likes : 'Like'}
                                      </span>
                                    </button>

                                    {canDeleteComment(reply.id) && (
                                      <div className="flex items-center gap-1.5">
                                        {isConfirmingReplyDelete ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteComment(reply.id)}
                                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold text-[10px] hover:bg-rose-700 cursor-pointer"
                                            >
                                              Confirm
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setPendingDeleteId(null)}
                                              className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-medium text-[10px] cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(reply.id)}
                                            className="inline-flex items-center gap-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Remove</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
