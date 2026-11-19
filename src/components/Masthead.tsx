import React, { useState, useEffect } from 'react';
import {
  Feather,
  Bookmark,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  Category,
  PublicationCategory,
  PublicationEditionConfig,
  Announcement,
  generateIssnForVolumeIssue,
} from '../types';
import { InkspirerLogo } from './InkspirerLogo';
import { FacebookQrCode } from './FacebookQrCode';
import { PhilippineTimeWeatherWidget } from './PhilippineTimeWeatherWidget';

interface MastheadProps {
  onOpenSubmit: () => void;
  onOpenEditorialDesk: () => void;
  onScrollToStories: () => void;
  bookmarksCount: number;
  onFilterBookmarks: () => void;
  showingBookmarks: boolean;
  activeCategory?: Category | 'All';
  onSelectCategory?: (cat: Category | 'All') => void;
  categories?: PublicationCategory[];
  editionConfig?: PublicationEditionConfig;
  onUpdateEditionConfig?: (updated: Partial<PublicationEditionConfig>, syncLeadStoryIssue?: boolean) => void;
  announcements?: Announcement[];
  onAddAnnouncement?: (ann: Omit<Announcement, 'id'>) => Announcement;
  onUpdateAnnouncement?: (id: string, updated: Partial<Announcement>) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onTogglePinAnnouncement?: (id: string) => void;
}

const DEFAULT_MASTHEAD_MENUS: { id: string; name: string; color: string; description: string }[] = [
  { id: 'cat-news', name: 'News', color: '#FB923C', description: 'Campus & RSPC Dispatches' },
  { id: 'cat-features', name: 'Features', color: '#38BDF8', description: 'People & Culture' },
  { id: 'cat-opinion', name: 'Opinion', color: '#D4AF37', description: 'Columns & Editorials' },
  { id: 'cat-sports', name: 'Sports', color: '#FACC15', description: 'Varsity & Athletics' },
  { id: 'cat-announcements', name: 'Announcements', color: '#C084FC', description: 'Circulars & Notices' },
];

export const Masthead: React.FC<MastheadProps> = ({
  onOpenSubmit,
  onOpenEditorialDesk,
  onScrollToStories,
  bookmarksCount,
  onFilterBookmarks,
  showingBookmarks,
  activeCategory = 'All',
  onSelectCategory,
  categories,
  editionConfig,
}) => {
  const [isDesktopLg, setIsDesktopLg] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktopLg(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const currentVolumeIssue = editionConfig?.volumeIssue || 'Vol. XXIV · Issue No. 1';
  const currentAcademicYear = editionConfig?.academicYear || 'Academic Year 2026–2027';
  const currentCirculation = editionConfig?.circulation || 'Circulation: 2,800+ Students & Faculty';
  const currentIssn = editionConfig?.issn || generateIssnForVolumeIssue(currentVolumeIssue);
  const currentMotto = editionConfig?.motto || '“Ideas in ink. Voices in motion.”';
  const currentTaglineDescription =
    editionConfig?.taglineDescription ||
    'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.';

  const menuList =
    categories && categories.length > 0 ? categories : DEFAULT_MASTHEAD_MENUS;

  const handleSelectMenu = (catName: Category | 'All') => {
    onSelectCategory?.(catName);
    onScrollToStories();
  };

  return (
    <div className="border-b border-[#58111A] bg-[#4A0E17] text-white">
      {/* Upper Publication Dateline & Accreditation */}
      <div className="border-b border-[#58111A] bg-[#3B0910] px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-1.5 sm:gap-3 text-[11px] sm:text-xs text-stone-300 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5">
            <span className="font-semibold text-[#F3C562] tracking-wide">
              REPUBLIC OF THE PHILIPPINES
            </span>
            <span aria-hidden="true" className="text-stone-500">·</span>
            <span>Department of Education</span>
            <span aria-hidden="true" className="hidden sm:inline text-stone-500">·</span>
            <span className="hidden sm:inline">Region XIII Caraga</span>
            <span aria-hidden="true" className="hidden md:inline text-stone-500">·</span>
            <span className="hidden md:inline">Division of Surigao del Sur</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-stone-300">
            <span>{currentVolumeIssue}</span>
            <span aria-hidden="true" className="text-stone-500">·</span>
            <span>{currentAcademicYear}</span>
            <span aria-hidden="true" className="hidden sm:inline text-stone-500">·</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex hover:text-white items-center gap-1 transition-colors text-stone-300 cursor-pointer"
              title="Print newspaper edition"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Print Edition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Masthead Presentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-12 text-center relative">
        {/* Desktop Left & Right Pinned Utilities — mounted ONLY on desktop (>=1024px) */}
        {isDesktopLg ? (
          <>
            <div className="absolute top-6 left-8 z-30">
              <PhilippineTimeWeatherWidget className="origin-top-left" />
            </div>
            <div className="absolute top-6 right-8 z-30">
              <FacebookQrCode size={64} className="origin-top-right shadow-2xl" />
            </div>
          </>
        ) : (
          /* Mobile & Tablet Utility Row — mounted ONLY on <1024px (zero duplicate timers/fetches) */
          <div className="flex items-start justify-between gap-2.5 sm:gap-4 mb-5 max-w-2xl mx-auto">
            <PhilippineTimeWeatherWidget className="flex-1 min-w-0 !w-auto max-w-[270px] sm:max-w-[290px]" />
            <FacebookQrCode size={56} className="shrink-0 shadow-xl" />
          </div>
        )}

        {/* Uploaded Barobo National High School Official Seal */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="relative group p-1 rounded-full bg-white/10 border-2 border-[#D4AF37]/80 shadow-xl hover:border-[#F3C562] transition-all">
            <img
              src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
              alt="Barobo National High School Official Seal"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain rounded-full shadow-inner transform group-hover:scale-105 transition-transform duration-300"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* School Name and Seal Framing */}
        <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 text-[11px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.25em] font-semibold text-[#F3C562]">
          <span className="h-px w-5 sm:w-8 bg-[#D4AF37]/60" />
          <span>Barobo National High School</span>
          <span className="h-px w-5 sm:w-8 bg-[#D4AF37]/60" />
        </div>

        {/* The Inkspirer Official Publication Emblem Logo above THE INKSPIRER */}
        <div className="flex flex-col items-center justify-center mb-2">
          <InkspirerLogo size="hero" className="hover:scale-105 transition-transform duration-300" />
        </div>

        {/* Master Newspaper Name */}
        <h1
          className="font-brand text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.06] mb-3 drop-shadow-sm"
          style={{ textWrap: 'balance' }}
        >
          THE INKSPIRER
        </h1>

        {/* Tagline & Subtitle */}
        <div className="space-y-2 mb-6 sm:mb-8">
          <p className="text-[11px] sm:text-sm font-semibold tracking-[0.16em] sm:tracking-[0.2em] uppercase text-[#D4AF37]">
            THE OFFICIAL DIGITAL NEWSLETTER PORTAL
          </p>
          <p className="font-serif italic text-lg sm:text-2xl text-stone-100">
            {currentMotto}
          </p>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-200 leading-relaxed pt-1 sm:pt-2 px-1">
            {currentTaglineDescription}
          </p>
        </div>

        {/* Hero Interactive CTAs */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onScrollToStories}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-sm font-bold text-stone-900 bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Stories</span>
            <span aria-hidden="true">↓</span>
          </button>

          <button
            onClick={onOpenSubmit}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-sm font-medium text-white bg-[#5C1521] border border-[#781B2B] rounded hover:bg-[#6D1B29] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Feather className="w-4 h-4 text-[#D4AF37]" />
            <span>Submit a Story</span>
          </button>

          <button
            onClick={onOpenEditorialDesk}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-sm font-bold text-stone-900 bg-[#F3C562] hover:bg-[#E5BE4A] rounded shadow-xs flex items-center justify-center gap-2 transition-all border border-[#D4AF37] cursor-pointer"
            title="Create, edit, delete, and upload photos for all Publication Categories"
          >
            <ShieldCheck className="w-4 h-4 text-[#4A0E17]" />
            <span>Editorial Desk & Categories</span>
          </button>

          {bookmarksCount > 0 && (
            <button
              onClick={onFilterBookmarks}
              className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-medium rounded border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                showingBookmarks
                  ? 'bg-amber-400 text-stone-900 border-amber-300 font-semibold'
                  : 'bg-[#3B0910] border-[#58111A] text-stone-200 hover:bg-[#480D15]'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Saved Articles ({bookmarksCount})</span>
            </button>
          )}
        </div>

        {/* Official Newspaper Publication Section Menus Ribbon */}
        <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-[#681622]">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3C562] mb-3">
            Publication Menus & Editorial Desks
          </div>
          <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0 -mx-1 px-1">
            <button
              type="button"
              onClick={() => handleSelectMenu('All')}
              className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 border cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                activeCategory === 'All' && !showingBookmarks
                  ? 'bg-[#84CC16] text-[#142304] border-[#A3E635] ring-2 ring-[#A3E635]/30'
                  : 'bg-[#34070E]/90 text-stone-200 border-[#681622] hover:border-[#A3E635]/60 hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    activeCategory === 'All' && !showingBookmarks ? '#142304' : '#A3E635',
                }}
              />
              <span>All Stories</span>
            </button>

            {menuList.map((cat) => {
              const isAnnouncementsCat =
                cat.name.toLowerCase() === 'announcements' ||
                cat.name.toLowerCase() === 'announcement';
              const isActive =
                !showingBookmarks &&
                (activeCategory.toLowerCase() === cat.name.toLowerCase() ||
                  (isAnnouncementsCat &&
                    activeCategory.toLowerCase() === 'announcement'));
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  onClick={() => handleSelectMenu(cat.name)}
                  className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 border cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                  style={
                    isActive
                      ? {
                          backgroundColor: cat.color,
                          color: '#142304',
                          borderColor: cat.color,
                        }
                      : {
                          backgroundColor: 'rgba(52, 7, 14, 0.9)',
                          color: '#F5F5F4',
                          borderColor: `${cat.color}66`,
                        }
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isActive ? '#142304' : cat.color,
                    }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editorial Quality & Trust Line */}
      <div className="border-t border-[#58111A] bg-[#38080F]/90 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-between text-[11px] sm:text-xs text-stone-300 gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0" />
            <span>Regulated by Republic Act No. 7079 (Campus Journalism Act of 1991)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1">
            <span className="text-stone-200 font-medium">{currentCirculation}</span>
            <span aria-hidden="true" className="text-stone-500">·</span>
            <span>{currentIssn}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


