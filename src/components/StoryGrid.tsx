import React from 'react';
import { Article, Announcement, Category, StudentAuthorProfile } from '../types';
import { StoryCard } from './StoryCard';
import { Calendar, Bell, FileText, Feather } from 'lucide-react';

interface StoryGridProps {
  articles: Article[];
  announcements: Announcement[];
  activeCategory: Category | 'All';
  searchQuery: string;
  onSelectArticle: (art: Article) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  likedArticles: string[];
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  onOpenSubmit: () => void;
  onResetFilters: () => void;
  showingBookmarks: boolean;
  authorProfiles?: StudentAuthorProfile[];
}

export const StoryGrid: React.FC<StoryGridProps> = ({
  articles,
  announcements,
  activeCategory,
  searchQuery,
  onSelectArticle,
  bookmarks,
  onToggleBookmark,
  likedArticles,
  onToggleLike,
  onOpenSubmit,
  onResetFilters,
  showingBookmarks,
  authorProfiles = [],
}) => {
  // If user selected Announcements / Announcement category or search matches announcements
  const isAnnouncementsMenu =
    activeCategory.toLowerCase() === 'announcements' ||
    activeCategory.toLowerCase() === 'announcement';
  if (isAnnouncementsMenu) {
    const filteredAnnouncements = announcements.filter((ann) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        ann.type.toLowerCase().includes(q)
      );
    });

    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-[#F3C562] font-semibold mb-1">
            Barobo National High School Gazette
          </div>
          <h2 className="font-serif text-3xl font-bold text-white">
            Campus Announcements & Notices
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            Official circulars, academic calendar reminders, examinations, and student events.
          </p>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded p-8">
            <Bell className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No Announcements Found</h3>
            <p className="text-xs text-stone-500 mt-1">
              No official announcements match your current search criteria.
            </p>
            <button
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-xs font-medium text-[#0B2545] bg-stone-100 hover:bg-stone-200 rounded transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white border border-stone-200 rounded p-6 flex flex-col justify-between hover:border-stone-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-3">
                    <span className="font-semibold uppercase tracking-wider text-[#991B1B]">
                      {ann.type} Notice
                    </span>
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pinned Bulletin
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-2 leading-snug">
                    {ann.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-4 pb-3 border-b border-stone-100">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Posted {ann.date}</span>
                    {ann.deadline && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-stone-800">Deadline: {ann.deadline}</span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line mb-4">
                    {ann.content}
                  </p>
                </div>

                {ann.location && (
                  <div className="text-xs text-stone-500 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span>Venue: {ann.location}</span>
                    <span className="text-stone-400">BNHS Administration</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Articles empty state
  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-lg p-12 max-w-lg mx-auto shadow-2xs">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="font-serif text-2xl font-bold text-stone-800 mb-2">
            {showingBookmarks ? 'No Bookmarked Stories' : 'No Stories Found'}
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            {showingBookmarks
              ? 'You have not saved any stories to your reading list yet. Click the bookmark ribbon on any story to save it for later.'
              : `We couldn't find any articles matching your search query "${searchQuery}" in this category.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#4A0E17] hover:bg-[#6B1420] rounded transition-colors flex items-center gap-1.5"
            >
              <Feather className="w-3.5 h-3.5 text-[#F3C562]" />
              <span>Submit a Story</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => {
          // Calculate estimated reading time dynamically based on content length (words / 200 wpm)
          const contentString = Array.isArray(article.content)
            ? article.content.join(' ')
            : typeof article.content === 'string'
            ? article.content
            : '';
          const totalWords = `${article.title || ''} ${article.deck || ''} ${contentString} ${article.pullQuote || ''}`
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          const calculatedMinutes = Math.max(1, Math.ceil(totalWords / 200));
          const calculatedReadTime = `${calculatedMinutes} min read`;

          const articleWithCalculatedTime: Article = {
            ...article,
            readTime: calculatedReadTime,
          };

          const matchedAuthorProfile =
            authorProfiles.find(
              (p) =>
                (article.authorProfileId && p.id === article.authorProfileId) ||
                p.name.trim().toLowerCase() === article.author.trim().toLowerCase()
            ) || null;

          return (
            <StoryCard
              key={article.id}
              article={articleWithCalculatedTime}
              onSelect={onSelectArticle}
              isBookmarked={bookmarks.includes(article.id)}
              onToggleBookmark={onToggleBookmark}
              isLiked={likedArticles.includes(article.id)}
              onToggleLike={onToggleLike}
              authorProfile={matchedAuthorProfile}
            />
          );
        })}
      </div>
    </div>
  );
};
