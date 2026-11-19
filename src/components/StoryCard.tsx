import React from 'react';
import { Bookmark, Heart, ArrowUpRight, Clock, Film } from 'lucide-react';
import { Article, StudentAuthorProfile } from '../types';
import { EditorialArtwork } from './EditorialArtwork';
import { AuthorProfile } from './AuthorProfile';

interface StoryCardProps {
  article: Article;
  onSelect: (art: Article) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isLiked: boolean;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  authorProfile?: StudentAuthorProfile | null;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  article,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  isLiked,
  onToggleLike,
  authorProfile = null,
}) => {
  return (
    <article
      onClick={() => onSelect(article)}
      className="group cursor-pointer bg-white border border-stone-200 rounded overflow-hidden flex flex-col justify-between hover:border-stone-400 hover:shadow-xs transition-all duration-200"
    >
      <div>
        {/* Visual Artwork Thumbnail */}
        <div className="relative h-48 w-full border-b border-stone-200 overflow-hidden bg-stone-100">
          <EditorialArtwork
            category={article.category}
            customImageUrl={article.imageUrl}
            className="w-full h-full"
            variant="card"
          />
          {article.featured && !article.leadStory && (
            <div className="absolute top-2 left-2 bg-[#4A0E17]/90 text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded backdrop-blur-xs">
              Special Feature
            </div>
          )}
          {article.videoUrl && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-[#4A0E17]/95 text-[#F3C562] text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-[#D4AF37]/60 shadow-sm">
              <Film className="w-3 h-3" />
              <span>Video</span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-5">
          {/* Zero-Pill Unboxed Metadata with Category Color Indicator & Estimated Read Time */}
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span
                className={`w-2 h-2 rounded-full ${
                  article.category === 'News'
                    ? 'bg-[#FB923C]'
                    : article.category === 'Features'
                    ? 'bg-[#38BDF8]'
                    : article.category === 'Opinion'
                    ? 'bg-[#D4AF37]'
                    : article.category === 'Sports'
                    ? 'bg-[#FACC15]'
                    : 'bg-[#C084FC]'
                }`}
              />
              <span
                className={
                  article.category === 'News'
                    ? 'text-[#EA580C]'
                    : article.category === 'Features'
                    ? 'text-[#0284C7]'
                    : article.category === 'Opinion'
                    ? 'text-[#B45309]'
                    : article.category === 'Sports'
                    ? 'text-[#CA8A04]'
                    : 'text-[#9333EA]'
                }
              >
                {article.category}
              </span>
            </span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span>{article.date}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="inline-flex items-center gap-1 text-stone-600 font-medium" title="Calculated from content length">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{article.readTime}</span>
            </span>
          </div>

          {/* Headline */}
          <h3
            className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#781423] transition-colors leading-snug mb-2.5"
            style={{ textWrap: 'balance' }}
          >
            {article.title}
          </h3>

          {/* Deck */}
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3 mb-4">
            {article.deck}
          </p>

          {/* Pullquote snippet if any */}
          {article.pullQuote && (
            <blockquote className="font-serif italic text-xs text-stone-700 border-t border-b border-stone-100 py-2 mb-3 line-clamp-2">
              {article.pullQuote}
            </blockquote>
          )}

          {/* Author Component: Writer's name, short bio, and profile icon */}
          <div className="pt-3 border-t border-stone-100">
            <AuthorProfile
              author={article.author}
              role={article.authorRole}
              bio={article.authorBio}
              photoUrl={article.authorPhotoUrl}
              gradeSection={article.authorGradeSection}
              profile={authorProfile}
              variant="card"
            />
          </div>
        </div>
      </div>

      {/* Card Utility Footer */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#FBF9F5]/70 border-t border-stone-100 flex items-center justify-between text-xs">
        <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">BNHS Official Scribe</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Like */}
          <button
            onClick={(e) => onToggleLike(article.id, e)}
            className={`inline-flex items-center justify-center gap-1 min-w-[36px] min-h-[36px] px-1.5 rounded transition-colors cursor-pointer ${
              isLiked ? 'text-rose-600 bg-rose-50/70' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
            title="Like story"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
            <span className="tabular-nums text-[11px]">{article.likes}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={(e) => onToggleBookmark(article.id, e)}
            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition-colors cursor-pointer ${
              isBookmarked ? 'text-amber-600 bg-amber-50/70' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600' : ''}`} />
          </button>

          <span className="text-stone-400 group-hover:text-[#133E87] transition-colors ml-0.5">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
