import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bookmark,
  Heart,
  Share2,
  Printer,
  Calendar,
  Clock,
  User,
  Quote,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Article, StudentAuthorProfile } from '../types';
import { EditorialArtwork } from './EditorialArtwork';
import { InkspirerLogo } from './InkspirerLogo';
import { AuthorProfile } from './AuthorProfile';
import { ArticleComments } from './ArticleComments';

interface ArticleReaderModalProps {
  article: Article | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isLiked: boolean;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  savedProgress?: number;
  onUpdateReadingProgress?: (id: string, progress: number) => void;
  authorProfiles?: StudentAuthorProfile[];
  articles?: Article[];
  onSelectArticle?: (art: Article) => void;
  onUpdateAuthorProfile?: (
    id: string,
    updated: Partial<StudentAuthorProfile>,
    previousName?: string
  ) => void;
  onAddAuthorProfile?: (
    profile: Omit<StudentAuthorProfile, 'id'>
  ) => StudentAuthorProfile;
  onOpenEditorialDeskAuthorTab?: (authorName?: string) => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark,
  isLiked,
  onToggleLike,
  savedProgress = 0,
  onUpdateReadingProgress,
  authorProfiles = [],
  articles = [],
  onSelectArticle,
  onUpdateAuthorProfile,
  onAddAuthorProfile,
  onOpenEditorialDeskAuthorTab,
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const articleBodyRef = useRef<HTMLDivElement>(null);

  // Reset or restore reading progress and scroll position when opening an article
  useEffect(() => {
    if (!article) return;
    setReadingProgress(savedProgress > 0 && savedProgress < 100 ? savedProgress : 0);
    if (articleBodyRef.current) {
      articleBodyRef.current.scrollTop = 0;
    }
    if (outerContainerRef.current) {
      outerContainerRef.current.scrollTop = 0;
    }

    // If user had unfinished progress (between 5% and 95%), smoothly scroll to where they left off
    if (savedProgress >= 5 && savedProgress < 95) {
      const timer = setTimeout(() => {
        const el = articleBodyRef.current;
        if (!el) return;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 10) {
          el.scrollTo({
            top: (savedProgress / 100) * maxScroll,
            behavior: 'smooth',
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [article?.id]);

  // Recalculate progress when font size changes or window resizes
  useEffect(() => {
    const updateProgress = () => {
      const el = articleBodyRef.current;
      if (!el) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 5) {
        setReadingProgress(100);
      } else {
        const progress = Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100));
        setReadingProgress(progress);
      }
    };
    const timer = setTimeout(updateProgress, 60);
    window.addEventListener('resize', updateProgress);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateProgress);
    };
  }, [article?.id, fontSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.speechSynthesis?.cancel();
    };
  }, [onClose]);

  if (!article) return null;

  const matchedAuthorProfile =
    authorProfiles.find(
      (p) =>
        (article.authorProfileId && p.id === article.authorProfileId) ||
        p.name.trim().toLowerCase() === article.author.trim().toLowerCase()
    ) || null;

  const authorArticles = articles.filter(
    (a) =>
      (matchedAuthorProfile && a.authorProfileId === matchedAuthorProfile.id) ||
      a.author.trim().toLowerCase() === article.author.trim().toLowerCase()
  );

  const contentString = Array.isArray(article.content) ? article.content.join(' ') : (article.content || '');
  const contentWordCount = contentString
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const totalWords = `${article.title || ''} ${article.deck || ''} ${contentString} ${article.pullQuote || ''}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const wordCountForReadTime = contentWordCount > 0 ? contentWordCount : totalWords;
  const totalReadMinutes = Math.max(1, Math.ceil(wordCountForReadTime / 200));
  const estimatedReadingTime = `${totalReadMinutes} min read`;
  const remainingMinutes = Math.max(0, Math.ceil(totalReadMinutes * (1 - readingProgress / 100)));

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll > 5) {
      const progress = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
      setReadingProgress(progress);
      onUpdateReadingProgress?.(article.id, progress);
    } else {
      setReadingProgress(100);
      onUpdateReadingProgress?.(article.id, 100);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = articleBodyRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      el.scrollTo({
        top: maxScroll * clickRatio,
        behavior: 'smooth',
      });
      onUpdateReadingProgress?.(article.id, clickRatio * 100);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `"${article.title}" — Read on The Inkspirer (Barobo National High School Official Publication)`
    );
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleSpeechToggle = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${article.title}. By ${article.author}. ${article.deck}. ${article.content.join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed';
      case 'xl':
        return 'text-xl leading-loose';
      default:
        return 'text-base leading-relaxed';
    }
  };

  return (
    <div
      ref={outerContainerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6"
    >
      <div className="bg-[#FBF9F5] text-[#1C1917] w-full max-w-4xl h-screen sm:h-auto sm:max-h-[92vh] sm:rounded-lg shadow-2xl border border-stone-200 flex flex-col overflow-hidden relative">
        {/* Scroll-Based Reading Progress Bar Pinned at the Top of ArticleReaderModal */}
        <div
          onClick={handleProgressBarClick}
          className="shrink-0 w-full h-2.5 bg-[#34070E]/15 hover:h-3 transition-all cursor-pointer relative overflow-hidden group"
          role="progressbar"
          aria-label="Editorial reading progress"
          aria-valuenow={Math.round(readingProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          title={`Reading progress: ${Math.round(readingProgress)}% — Click anywhere on the bar to jump`}
        >
          <div
            className="h-full bg-linear-to-r from-[#4A0E17] via-[#991B1B] to-[#D4AF37] transition-[width] duration-100 ease-out relative"
            style={{ width: `${readingProgress}%` }}
          >
            <span className="absolute right-0 top-0 bottom-0 w-2 bg-[#F3C562] shadow-[0_0_8px_#D4AF37] rounded-full" />
          </div>
        </div>

        {/* Pinned Utility Header at the Top of the Modal */}
        <div className="shrink-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 truncate">
            {/* BNHS Logo & Inkspirer Emblem */}
            <img
              src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
              alt="BNHS Logo"
              className="w-5 h-5 object-contain rounded-full border border-[#D4AF37]/80 shrink-0"
            />
            <InkspirerLogo size="sm" className="w-5 h-5 shrink-0 hidden xs:inline-flex" />
            <span className="font-semibold text-[#0B2545] font-brand hidden sm:inline">
              THE INKSPIRER
            </span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="font-semibold text-[#133E87]">{article.category} Desk</span>
            <span className="hidden md:inline" aria-hidden="true">·</span>
            <span className="truncate hidden md:inline">{article.issue}</span>

            <span aria-hidden="true">·</span>

            {/* Estimated Reading Time Based on Content Word Count */}
            <span
              className="inline-flex items-center gap-1 font-semibold text-[#4A0E17] shrink-0 tabular-nums"
              title={`Estimated reading time based on ${wordCountForReadTime.toLocaleString()} words`}
            >
              <Clock className="w-3.5 h-3.5 text-[#781423]" />
              <span>{estimatedReadingTime}</span>
              <span className="hidden lg:inline font-normal text-stone-500">
                ({wordCountForReadTime.toLocaleString()} words)
              </span>
            </span>

            <span className="hidden sm:inline" aria-hidden="true">·</span>

            {/* Live Scroll Reading Progress Indicator */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 tabular-nums ${
                readingProgress >= 98 ? 'text-emerald-700' : 'text-stone-600'
              }`}
              title={
                readingProgress >= 98
                  ? 'Editorial completed!'
                  : `${Math.round(readingProgress)}% through this editorial (${remainingMinutes} min left)`
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  readingProgress >= 98 ? 'bg-emerald-500' : 'bg-[#D4AF37]'
                }`}
              />
              <span>
                {readingProgress >= 98 ? '100% · Finished' : `${Math.round(readingProgress)}% read`}
              </span>
              {readingProgress > 0 && readingProgress < 98 && (
                <span className="hidden xl:inline text-stone-400 font-normal">
                  · {remainingMinutes}m left
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center bg-stone-100 rounded border border-stone-200 p-0.5 text-xs text-stone-700">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-white font-bold shadow-2xs' : ''}`}
                title="Default text size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded ${fontSize === 'large' ? 'bg-white font-bold shadow-2xs' : ''}`}
                title="Larger text size"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-2 py-0.5 rounded ${fontSize === 'xl' ? 'bg-white font-bold shadow-2xs' : ''}`}
                title="Maximum text size"
              >
                A++
              </button>
            </div>

            {/* Audio Reader */}
            <button
              onClick={handleSpeechToggle}
              className={`p-2 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors ${
                isSpeaking ? 'text-[#133E87] bg-blue-50' : ''
              }`}
              title={isSpeaking ? 'Stop listening' : 'Listen to story'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-blue-700" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="p-2 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              title="Print article"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors relative"
              title="Copy share link"
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Like */}
            <button
              onClick={(e) => onToggleLike(article.id, e)}
              className={`p-2 rounded transition-colors ${
                isLiked ? 'text-rose-600 bg-rose-50' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Like article"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
            </button>

            {/* Bookmark */}
            <button
              onClick={(e) => onToggleBookmark(article.id, e)}
              className={`p-2 rounded transition-colors ${
                isBookmarked ? 'text-amber-700 bg-amber-50' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title={isBookmarked ? 'Saved to bookmarks' : 'Bookmark article'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors ml-1"
              title="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div
          ref={articleBodyRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="p-6 sm:p-10 lg:p-12 max-w-3xl mx-auto w-full">
          {/* Category, Date & Estimated Reading Time Metadata Header */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-3">
            <span className="font-bold uppercase tracking-wider text-[#133E87]">
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>Published {article.date}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#4A0E17] tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#781423]" />
              <span>{estimatedReadingTime}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{wordCountForReadTime.toLocaleString()} words</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{article.views} views</span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.2] tracking-tight mb-4"
            style={{ textWrap: 'balance' }}
          >
            {article.title}
          </h1>

          {/* Subtitle / Deck */}
          <p className="font-sans text-lg sm:text-xl text-stone-600 leading-relaxed mb-6 font-normal">
            {article.deck}
          </p>

          {/* Byline Strip with Author Component */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-stone-200 py-3.5 mb-8 gap-3">
            <AuthorProfile
              author={article.author}
              role={article.authorRole}
              bio={article.authorBio}
              photoUrl={article.authorPhotoUrl}
              gradeSection={article.authorGradeSection}
              journalismMotto={article.authorMotto}
              accolades={article.authorAccolades}
              profile={matchedAuthorProfile}
              variant="reader-header"
            />

            <div className="text-left sm:text-right text-stone-500 text-xs shrink-0 pl-12 sm:pl-0">
              <div className="font-medium text-stone-700">Barobo National High School</div>
              <div className="text-[11px]">Region XIII Caraga · DepEd Division Surigao del Sur</div>
            </div>
          </div>

          {/* Editorial Artwork Hero */}
          <div className="mb-8 rounded border border-stone-200 overflow-hidden shadow-xs">
            <EditorialArtwork
              category={article.category}
              customImageUrl={article.imageUrl}
              className="w-full h-64 sm:h-80"
              variant="lead"
            />
            {article.imageCaption && (
              <div className="bg-white p-3 border-t border-stone-100 text-xs font-serif italic text-stone-600">
                {article.imageCaption}
              </div>
            )}
          </div>

          {/* Pull Quote Highlight */}
          {article.pullQuote && (
            <div className="my-8 py-6 border-y-2 border-stone-200 bg-white/70 px-6 sm:px-8 text-center">
              <Quote className="w-6 h-6 text-[#133E87]/40 mx-auto mb-2" />
              <blockquote className="font-serif italic text-xl sm:text-2xl text-stone-800 leading-relaxed">
                {article.pullQuote}
              </blockquote>
            </div>
          )}

          {/* Story Paragraphs with Drop Cap on the First Paragraph */}
          <div className={`space-y-6 text-stone-800 font-sans ${getFontSizeClass()}`}>
            {article.content.map((paragraph, index) => {
              if (index === 0) {
                // First letter drop cap
                const firstLetter = paragraph.charAt(0);
                const restOfParagraph = paragraph.slice(1);
                return (
                  <p key={index} className="leading-relaxed">
                    <span className="float-left text-5xl sm:text-6xl font-serif font-bold text-[#0B2545] leading-none pr-3 pt-1">
                      {firstLetter}
                    </span>
                    {restOfParagraph}
                  </p>
                );
              }
              return (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Article Footer & Full Author Editorial Profile */}
          <div className="mt-12 pt-8 border-t border-stone-300 space-y-6">
            {/* Dedicated Student Journalist Author Bio Profile Section */}
            <AuthorProfile
              author={article.author}
              role={article.authorRole}
              bio={article.authorBio}
              photoUrl={article.authorPhotoUrl}
              gradeSection={article.authorGradeSection}
              journalismMotto={article.authorMotto}
              accolades={article.authorAccolades}
              profile={matchedAuthorProfile}
              authorArticles={authorArticles}
              currentArticleId={article.id}
              onSelectArticle={onSelectArticle}
              onUpdateAuthorProfile={onUpdateAuthorProfile}
              onAddAuthorProfile={onAddAuthorProfile}
              onOpenEditorialDeskAuthorTab={onOpenEditorialDeskAuthorTab}
              variant="reader-card"
            />

            {/* Publication Accreditation & Reader Actions */}
            <div className="bg-white p-5 rounded-lg border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#4A0E17]">
                  Published by The Inkspirer
                </div>
                <div className="text-sm font-bold text-stone-900 mt-0.5">
                  Official Campus Journalism Division of Barobo National High School
                </div>
                <p className="text-xs text-stone-600 mt-1 max-w-md">
                  Articles published on this portal reflect student journalism excellence, community reporting, and free student expression under Republic Act No. 7079.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={(e) => onToggleLike(article.id, e)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                    isLiked
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{article.likes} Likes</span>
                </button>

                <button
                  onClick={(e) => onToggleBookmark(article.id, e)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                    isBookmarked
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{isBookmarked ? 'Bookmarked' : 'Save Story'}</span>
                </button>
              </div>
            </div>

            {/* Reader Comments & Interactive Community Discussion */}
            <ArticleComments articleId={article.id} articleTitle={article.title} />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
