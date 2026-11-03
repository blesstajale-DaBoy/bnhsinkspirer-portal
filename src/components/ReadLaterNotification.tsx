import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  BookOpen,
  Clock,
  CheckCircle2,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Trash2,
  BellRing,
} from 'lucide-react';
import { Article } from '../types';

interface ReadLaterNotificationProps {
  articles: Article[];
  bookmarks: string[];
  readingProgressMap: Record<string, number>;
  onSelectArticle: (article: Article) => void;
  onMarkAsRead: (articleId: string) => void;
  onRemoveBookmark: (articleId: string, e: React.MouseEvent) => void;
  onViewAllBookmarks: () => void;
}

const VISIT_STORAGE_KEY = 'the_inkspirer_read_later_visit_meta_v1';

interface UnfinishedBookmarkItem {
  article: Article;
  progress: number;
  totalMinutes: number;
  remainingMinutes: number;
  wordCount: number;
}

function calculateArticleWordStats(article: Article, progress: number) {
  const bodyText = Array.isArray(article.content)
    ? article.content.join(' ')
    : article.content || '';
  const wordCount = `${article.title || ''} ${article.deck || ''} ${bodyText} ${article.pullQuote || ''}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const totalMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const remainingMinutes = Math.max(
    1,
    Math.ceil(totalMinutes * (1 - Math.min(100, Math.max(0, progress)) / 100))
  );
  return { wordCount, totalMinutes, remainingMinutes };
}

export const ReadLaterNotification: React.FC<ReadLaterNotificationProps> = ({
  articles,
  bookmarks,
  readingProgressMap,
  onSelectArticle,
  onMarkAsRead,
  onRemoveBookmark,
  onViewAllBookmarks,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissedForSession, setIsDismissedForSession] = useState(false);
  const [isReturnVisitPrompt, setIsReturnVisitPrompt] = useState(false);
  const [lastVisitLabel, setLastVisitLabel] = useState<string | null>(null);

  // Compute all bookmarked articles that haven't been finished (< 95% progress)
  const unfinishedItems: UnfinishedBookmarkItem[] = useMemo(() => {
    return bookmarks
      .map((id) => articles.find((a) => a.id === id))
      .filter((a): a is Article => Boolean(a))
      .map((article) => {
        const progress = readingProgressMap[article.id] ?? 0;
        const { wordCount, totalMinutes, remainingMinutes } = calculateArticleWordStats(
          article,
          progress
        );
        return {
          article,
          progress,
          totalMinutes,
          remainingMinutes,
          wordCount,
        };
      })
      .filter((item) => item.progress < 95);
  }, [articles, bookmarks, readingProgressMap]);

  const finishedBookmarksCount = useMemo(() => {
    return bookmarks.filter((id) => (readingProgressMap[id] ?? 0) >= 95).length;
  }, [bookmarks, readingProgressMap]);

  // Check localStorage on mount to see if user is returning with unread bookmarked articles
  useEffect(() => {
    try {
      const rawMeta = localStorage.getItem(VISIT_STORAGE_KEY);
      const now = Date.now();

      if (rawMeta) {
        const parsed = JSON.parse(rawMeta);
        if (parsed.lastVisitTimestamp) {
          const prevDate = new Date(parsed.lastVisitTimestamp);
          setLastVisitLabel(
            prevDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          );
        }
      }

      // Record current visit timestamp in localStorage
      localStorage.setItem(
        VISIT_STORAGE_KEY,
        JSON.stringify({
          lastVisitTimestamp: now,
        })
      );

      // If the user already has unfinished bookmarks stored from a prior visit, prompt them automatically
      const storedBookmarksRaw = localStorage.getItem('the_inkspirer_bookmarks_v1');
      const storedProgressRaw = localStorage.getItem('the_inkspirer_reading_progress_v1');
      const storedBookmarks: string[] = storedBookmarksRaw ? JSON.parse(storedBookmarksRaw) : [];
      const storedProgress: Record<string, number> = storedProgressRaw
        ? JSON.parse(storedProgressRaw)
        : {};

      const hasPendingFromStorage = storedBookmarks.some(
        (id) => (storedProgress[id] ?? 0) < 95
      );

      if (hasPendingFromStorage) {
        setIsReturnVisitPrompt(true);
        setIsExpanded(true);
      }
    } catch (e) {
      console.warn('Read-later visit check warning:', e);
    }
  }, []);

  // Automatically reveal the notification card when a user bookmarks their first unfinished story
  useEffect(() => {
    if (unfinishedItems.length > 0 && !isDismissedForSession && !isExpanded) {
      setIsExpanded(true);
    }
  }, [unfinishedItems.length]);

  if (unfinishedItems.length === 0) {
    return null;
  }

  const totalRemainingMinutes = unfinishedItems.reduce(
    (sum, item) => sum + item.remainingMinutes,
    0
  );
  const unstartedCount = unfinishedItems.filter((item) => item.progress === 0).length;
  const inProgressCount = unfinishedItems.length - unstartedCount;

  // Build a natural-language summary of unread bookmarked content
  const categoriesList = Array.from(
    new Set(unfinishedItems.map((item) => item.article.category))
  );
  const categoriesText =
    categoriesList.length === 1
      ? categoriesList[0]
      : categoriesList.length === 2
      ? `${categoriesList[0]} and ${categoriesList[1]}`
      : `${categoriesList.slice(0, -1).join(', ')}, and ${
          categoriesList[categoriesList.length - 1]
        }`;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-[26rem] font-sans"
      role="region"
      aria-label="Read-Later Catch-Up Notification"
    >
      {/* Minimized Pill State */}
      {!isExpanded ? (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setIsExpanded(true);
              setIsDismissedForSession(false);
            }}
            className="group flex items-center gap-3 bg-[#34070E] hover:bg-[#4A0E17] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#D4AF37]/50 transition-all duration-200 cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3C562]">
              <Bookmark className="w-4 h-4 fill-[#F3C562]" />
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#D4AF37] text-[#0B2545] text-[10px] font-extrabold flex items-center justify-center">
                {unfinishedItems.length}
              </span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F3C562]">
                  Read-Later Catch-Up
                </span>
                <span className="text-[10px] text-stone-300 font-mono">
                  · ~{totalRemainingMinutes}m left
                </span>
              </div>
              <p className="text-[11px] text-stone-200 truncate max-w-[14rem]">
                {unfinishedItems[0].article.title}
              </p>
            </div>
            <ChevronUp className="w-4 h-4 text-[#F3C562] group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      ) : (
        /* Expanded Read-Later Notification Card */
        <div className="bg-[#FBF9F5] text-[#1C1917] rounded-xl shadow-2xl border-2 border-[#D4AF37]/70 overflow-hidden flex flex-col max-h-[82vh]">
          {/* Top Maroon & Gold Editorial Banner */}
          <div className="bg-linear-to-r from-[#34070E] via-[#4A0E17] to-[#0B2545] text-white px-4 py-3.5 border-b border-[#D4AF37]/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/60 flex items-center justify-center text-[#F3C562] shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#0B2545]">
                      {isReturnVisitPrompt ? 'Welcome Back · Read-Later' : 'Read-Later Queue'}
                    </span>
                    {lastVisitLabel && isReturnVisitPrompt && (
                      <span className="text-[10px] text-amber-200/80">
                        Last visit: {lastVisitLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white mt-0.5 leading-snug">
                    Catch Up on Your Saved Stories
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Minimize to corner badge"
                  aria-label="Minimize Read-Later prompt"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setIsDismissedForSession(true);
                  }}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss for now"
                  aria-label="Dismiss Read-Later prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Row */}
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-amber-100/90">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Bookmark className="w-3.5 h-3.5 text-[#F3C562] fill-[#F3C562]" />
                  {unfinishedItems.length}{' '}
                  {unfinishedItems.length === 1 ? 'unfinished article' : 'unfinished articles'}
                </span>
                <span className="text-white/30">|</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#F3C562]">
                  <Clock className="w-3.5 h-3.5" />
                  ~{totalRemainingMinutes} min total left
                </span>
              </div>
              {finishedBookmarksCount > 0 && (
                <span className="text-[10px] text-emerald-300 font-medium">
                  {finishedBookmarksCount} completed
                </span>
              )}
            </div>
          </div>

          {/* Unread Content Digest Summary */}
          <div className="px-4 py-3 bg-amber-50/80 border-b border-amber-200/70">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
              <div className="text-xs text-stone-700 leading-relaxed">
                <span className="font-bold text-[#34070E]">Unread Bookmark Summary: </span>
                You have{' '}
                <span className="font-semibold text-stone-900">
                  {unstartedCount > 0 && `${unstartedCount} unstarted`}
                  {unstartedCount > 0 && inProgressCount > 0 && ' and '}
                  {inProgressCount > 0 && `${inProgressCount} partially read`}
                </span>{' '}
                {unfinishedItems.length === 1 ? 'story' : 'stories'} in{' '}
                <span className="font-semibold text-[#0B2545]">{categoriesText}</span>:
              </div>
            </div>
          </div>

          {/* Scrollable List of Unfinished Bookmarked Articles with Summaries */}
          <div className="p-3 space-y-2.5 overflow-y-auto max-h-72 divide-y divide-stone-200/60">
            {unfinishedItems.map(({ article, progress, remainingMinutes }) => (
              <div
                key={article.id}
                className="pt-2.5 first:pt-0 bg-white rounded-lg p-3 border border-stone-200/90 shadow-xs hover:border-[#4A0E17]/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      article.categoryTheme?.badgeBg || 'bg-stone-100'
                    } ${article.categoryTheme?.badgeText || 'text-stone-800'}`}
                  >
                    {article.category}
                  </span>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span
                      className={`font-mono font-semibold px-1.5 py-0.5 rounded ${
                        progress > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {progress > 0 ? `${progress}% read` : 'Unread · 0%'}
                    </span>
                    <span className="text-stone-500 font-mono">{remainingMinutes}m left</span>
                  </div>
                </div>

                {/* Headline */}
                <h4
                  onClick={() => onSelectArticle(article)}
                  className="font-display font-bold text-sm text-[#1C1917] hover:text-[#4A0E17] cursor-pointer line-clamp-1 transition-colors"
                >
                  {article.title}
                </h4>

                {/* Summary / Deck */}
                <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                  {article.deck}
                </p>

                {/* Individual Progress Bar */}
                <div className="mt-2.5 w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#4A0E17] to-[#D4AF37] transition-all duration-300"
                    style={{ width: `${Math.max(4, progress)}%` }}
                  />
                </div>

                {/* Action Row */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onSelectArticle(article)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#34070E] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#F3C562]" />
                    <span>{progress > 0 ? 'Continue Reading' : 'Start Reading'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMarkAsRead(article.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors cursor-pointer"
                      title="Mark this bookmarked article as finished"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Mark Read</span>
                    </button>

                    <button
                      onClick={(e) => onRemoveBookmark(article.id, e)}
                      className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Remove from bookmarks"
                      aria-label="Remove bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="px-4 py-2.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => {
                onViewAllBookmarks();
                setIsExpanded(false);
              }}
              className="font-semibold text-[#0B2545] hover:text-[#4A0E17] underline underline-offset-2 cursor-pointer"
            >
              Filter Grid by Saved ({bookmarks.length})
            </button>

            <button
              onClick={() => {
                setIsExpanded(false);
                setIsDismissedForSession(true);
              }}
              className="text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
            >
              Remind Me Next Visit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
