import React from 'react';
import { ArrowRight, Bookmark, Heart, Eye } from 'lucide-react';
import { Article, StudentAuthorProfile } from '../types';
import { EditorialArtwork } from './EditorialArtwork';
import { AuthorProfile } from './AuthorProfile';

interface LeadStoryProps {
  article: Article;
  onSelect: (art: Article) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isLiked: boolean;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  authorProfiles?: StudentAuthorProfile[];
}

export const LeadStory: React.FC<LeadStoryProps> = ({
  article,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  isLiked,
  onToggleLike,
  authorProfiles = [],
}) => {
  const matchedProfile =
    authorProfiles.find(
      (p) =>
        (article.authorProfileId && p.id === article.authorProfileId) ||
        p.name.trim().toLowerCase() === article.author.trim().toLowerCase()
    ) || null;
  // Calculate dynamic reading time based on content length
  const contentString = Array.isArray(article.content) ? article.content.join(' ') : (article.content || '');
  const totalWords = `${article.title || ''} ${article.deck || ''} ${contentString} ${article.pullQuote || ''}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const calculatedMinutes = Math.max(1, Math.ceil(totalWords / 200));
  const calculatedReadTime = `${calculatedMinutes} min read`;

  return (
    <section className="bg-[#4A0E17] border-b border-[#58111A]">
      <div className="max-w-7xl mx-auto px-6 py-8 sm:py-12">
        <div className="bg-[#FFFDF9] border border-[#6B1420]/30 rounded-lg p-6 sm:p-10 shadow-2xl">
          {/* Newspaper lead kicker */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-6 text-xs text-stone-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest uppercase text-[#781423]">
                Front-Page Lead Story
              </span>
            <span aria-hidden="true">·</span>
            <span>{article.issue}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>By The Inkspirer Editorial Board</span>
          </div>
        </div>

        {/* 2-Column Newspaper Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Main Headline & Excerpt Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Unboxed Metadata (Zero-pill discipline) */}
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                <span className="font-semibold uppercase tracking-wider text-[#133E87]">
                  {article.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{article.date}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-stone-600">{calculatedReadTime}</span>
              </div>

              {/* Big Editorial Headline */}
              <h2
                onClick={() => onSelect(article)}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.15] tracking-tight hover:text-[#133E87] transition-colors cursor-pointer mb-4"
                style={{ textWrap: 'balance' }}
              >
                {article.title}
              </h2>

              {/* Deck / Subtitle */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-sans mb-6">
                {article.deck}
              </p>

              {/* Pull quote highlight */}
              {article.pullQuote && (
                <div className="my-6 py-4 border-y border-stone-200 bg-[#FBF9F5]/80 px-4">
                  <p className="font-serif italic text-base sm:text-lg text-stone-800 leading-relaxed">
                    {article.pullQuote}
                  </p>
                </div>
              )}

              {/* Opening Paragraph snippet */}
              <p className="text-sm text-stone-700 leading-relaxed line-clamp-3 mb-6">
                {article.content[0]}
              </p>
            </div>

            {/* Action footer with Author Profile Component */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <AuthorProfile
                  author={article.author}
                  role={article.authorRole}
                  bio={article.authorBio}
                  photoUrl={article.authorPhotoUrl}
                  gradeSection={article.authorGradeSection}
                  profile={matchedProfile}
                  variant="card"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => onToggleLike(article.id, e)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                    isLiked
                      ? 'text-rose-600 bg-rose-50 border border-rose-200'
                      : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
                  }`}
                  title="Recommend story"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                  <span className="tabular-nums font-medium">{article.likes}</span>
                </button>

                <button
                  onClick={(e) => onToggleBookmark(article.id, e)}
                  className={`p-2 rounded text-xs transition-colors ${
                    isBookmarked
                      ? 'text-amber-700 bg-amber-50 border border-amber-200'
                      : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                </button>

                <button
                  onClick={() => onSelect(article)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#4A0E17] rounded hover:bg-[#6B1420] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Read Full Story</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F3C562]" />
                </button>
              </div>
            </div>
          </div>

          {/* Lead Visual Artwork Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              onClick={() => onSelect(article)}
              className="cursor-pointer group flex-1 rounded border border-stone-200 overflow-hidden flex flex-col bg-stone-50 shadow-xs"
            >
              <EditorialArtwork
                category={article.category}
                customImageUrl={article.imageUrl}
                className="w-full h-64 sm:h-80 lg:h-full min-h-[260px]"
                variant="lead"
              />
              {article.imageCaption && (
                <div className="p-3 bg-white border-t border-stone-100 text-[11px] font-serif italic text-stone-500 leading-snug">
                  Fig. 1 — {article.imageCaption}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};
