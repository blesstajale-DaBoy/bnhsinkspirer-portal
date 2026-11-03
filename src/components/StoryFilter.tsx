import React from 'react';
import { Search, X, SlidersHorizontal, Check, PlusCircle } from 'lucide-react';
import { Category, PublicationCategory } from '../types';

interface StoryFilterProps {
  activeCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'latest' | 'popular' | 'readTime';
  onSortChange: (sort: 'latest' | 'popular' | 'readTime') => void;
  totalStoriesCount: number;
  onOpenEditorialDesk?: () => void;
  categoriesList?: PublicationCategory[];
}

const MENU_COLORS: Record<Category | 'All', {
  activeBg: string;
  activeText: string;
  activeBorder: string;
  idleText: string;
  idleBorder: string;
  idleHoverBg: string;
  dotColor: string;
}> = {
  All: {
    activeBg: 'bg-[#84CC16]',
    activeText: 'text-[#142304]',
    activeBorder: 'border-[#84CC16]',
    idleText: 'text-[#A3E635]',
    idleBorder: 'border-[#84CC16]/50',
    idleHoverBg: 'hover:bg-[#84CC16]/15',
    dotColor: 'bg-[#84CC16]',
  },
  News: {
    activeBg: 'bg-[#FB923C]',
    activeText: 'text-[#2D1204]',
    activeBorder: 'border-[#FB923C]',
    idleText: 'text-[#FDBA74]',
    idleBorder: 'border-[#FB923C]/50',
    idleHoverBg: 'hover:bg-[#FB923C]/15',
    dotColor: 'bg-[#FB923C]',
  },
  Features: {
    activeBg: 'bg-[#38BDF8]',
    activeText: 'text-[#06202E]',
    activeBorder: 'border-[#38BDF8]',
    idleText: 'text-[#7DD3FC]',
    idleBorder: 'border-[#38BDF8]/50',
    idleHoverBg: 'hover:bg-[#38BDF8]/15',
    dotColor: 'bg-[#38BDF8]',
  },
  Opinion: {
    activeBg: 'bg-[#D4AF37]',
    activeText: 'text-[#2A1B02]',
    activeBorder: 'border-[#D4AF37]',
    idleText: 'text-[#F3C562]',
    idleBorder: 'border-[#D4AF37]/50',
    idleHoverBg: 'hover:bg-[#D4AF37]/15',
    dotColor: 'bg-[#D4AF37]',
  },
  Sports: {
    activeBg: 'bg-[#FACC15]',
    activeText: 'text-[#2E2002]',
    activeBorder: 'border-[#FACC15]',
    idleText: 'text-[#FEF08A]',
    idleBorder: 'border-[#FACC15]/50',
    idleHoverBg: 'hover:bg-[#FACC15]/15',
    dotColor: 'bg-[#FACC15]',
  },
  Announcements: {
    activeBg: 'bg-[#C084FC]',
    activeText: 'text-[#220738]',
    activeBorder: 'border-[#C084FC]',
    idleText: 'text-[#E9D5FF]',
    idleBorder: 'border-[#C084FC]/50',
    idleHoverBg: 'hover:bg-[#C084FC]/15',
    dotColor: 'bg-[#C084FC]',
  },
};

export const StoryFilter: React.FC<StoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalStoriesCount,
  onOpenEditorialDesk,
  categoriesList,
}) => {
  const dynamicCategories: { label: string; value: Category | 'All'; description: string; color: string }[] = [
    { label: 'All Stories', value: 'All', description: 'Everything published on campus', color: '#84CC16' },
    ...(categoriesList && categoriesList.length > 0
      ? categoriesList.map((c) => ({
          label: c.name,
          value: c.name,
          description: c.description || `Articles and coverage under ${c.name} desk`,
          color: c.color || '#FB923C',
        }))
      : [
          { label: 'News', value: 'News', description: 'School events & campus updates', color: '#FB923C' },
          { label: 'Features', value: 'Features', description: 'People, stories, & achievements', color: '#38BDF8' },
          { label: 'Opinion', value: 'Opinion', description: 'Student perspectives & editorials', color: '#D4AF37' },
          { label: 'Sports', value: 'Sports', description: 'Teams, competitions, & victories', color: '#FACC15' },
          { label: 'Announcements', value: 'Announcements', description: 'Important dates, reminders, & notices', color: '#C084FC' },
        ]),
  ];

  const currentCategoryObj = dynamicCategories.find(
    (c) => c.value.toLowerCase() === activeCategory.toLowerCase()
  ) || dynamicCategories[0];

  return (
    <div id="stories-section" className="scroll-mt-20 border-b border-[#58111A] bg-[#38080F] py-6 text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Category Description Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentCategoryObj.color }}
              />
              <span>
                {activeCategory === 'All'
                  ? 'Campus Dispatches & Editorial Archive'
                  : `${activeCategory} Desk`}
              </span>
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              {currentCategoryObj.description} · Showing{' '}
              <span
                className="font-semibold"
                style={{ color: currentCategoryObj.color }}
              >
                {totalStoriesCount}
              </span>{' '}
              entries
            </p>
          </div>

          {/* Sort Selector & Manage Action */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
            <span className="text-stone-400">Sort:</span>
            <div className="inline-flex items-center bg-[#28050B] p-0.5 rounded border border-[#58111A]">
              <button
                onClick={() => onSortChange('latest')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  sortBy === 'latest'
                    ? 'bg-[#4A0E17] text-[#F3C562] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => onSortChange('popular')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  sortBy === 'popular'
                    ? 'bg-[#4A0E17] text-[#F3C562] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Most Read
              </button>
            </div>

            {onOpenEditorialDesk && (
              <button
                type="button"
                onClick={onOpenEditorialDesk}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-[#4A0E17] text-[#F3C562] border border-[#6B1420] hover:bg-[#5C1521] transition-colors shadow-2xs"
                title="Create, edit, delete, and upload photos for stories and publication categories"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Editorial & Category Desk</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Segmented Category Buttons with requested distinct colors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
            {dynamicCategories.map((cat) => {
              const isActive = activeCategory.toLowerCase() === cat.value.toLowerCase();
              return (
                <button
                  key={cat.value}
                  onClick={() => onSelectCategory(cat.value)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 shadow-2xs"
                  style={
                    isActive
                      ? {
                          backgroundColor: cat.color,
                          color: '#142304',
                          borderColor: cat.color,
                        }
                      : {
                          backgroundColor: '#240408',
                          color: '#E5E7EB',
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
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Search className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search keyword, author, or beat..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#28050B] border border-[#58111A] rounded text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
