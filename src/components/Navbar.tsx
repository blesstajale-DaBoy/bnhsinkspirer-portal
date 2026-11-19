import React from 'react';
import { Category, PublicationCategory } from '../types';
import { InkspirerLogo } from './InkspirerLogo';
import { useAuth } from '../context/AuthContext';
import { Cloud, RefreshCw, UserCheck, LogIn, LogOut } from 'lucide-react';
import type { CloudSyncStatus } from '../hooks/useInkspirerStore';

interface NavbarProps {
  activeCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All') => void;
  onOpenSubmit: () => void;
  onOpenEditorialDesk: () => void;
  onOpenLogin: () => void;
  pendingSubmissionsCount: number;
  categories?: PublicationCategory[];
  syncStatus?: CloudSyncStatus;
  autoSyncEnabled?: boolean;
  lastSyncedAt?: string | null;
}

const DEFAULT_PUBLICATION_MENUS: { id: string; name: string; color: string }[] = [
  { id: 'cat-news', name: 'News', color: '#FB923C' },
  { id: 'cat-features', name: 'Features', color: '#38BDF8' },
  { id: 'cat-opinion', name: 'Opinion', color: '#E6C687' },
  { id: 'cat-sports', name: 'Sports', color: '#FACC15' },
  { id: 'cat-announcements', name: 'Announcements', color: '#C084FC' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenSubmit,
  onOpenEditorialDesk,
  onOpenLogin,
  pendingSubmissionsCount,
  categories,
  syncStatus = 'synced',
  autoSyncEnabled = true,
  lastSyncedAt = null,
}) => {
  const { userProfile, activeRoleConfig, isAuthorizedStaff, logout } = useAuth();

  const menuCategories =
    categories && categories.length > 0 ? categories : DEFAULT_PUBLICATION_MENUS;

  const handleMenuClick = (catName: Category | 'All', scrollToContent = true) => {
    onSelectCategory(catName);
    if (scrollToContent) {
      const el = document.getElementById('stories-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#34070E]/95 backdrop-blur-md border-b border-[#58111A]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark with School Crest & Publication Emblem */}
        <button
          onClick={() => handleMenuClick('All', false)}
          className="flex items-center gap-2 sm:gap-2.5 font-brand text-base sm:text-xl font-bold tracking-tight text-[#F3C562] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] group cursor-pointer"
        >
          <img
            src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
            alt="BNHS Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full border border-[#D4AF37]/80 shadow-xs group-hover:scale-105 transition-transform"
          />
          <InkspirerLogo size="sm" className="group-hover:scale-105 transition-transform" />
          <span className="hidden xs:inline">The Inkspirer</span>
        </button>

        {/* Zone 2: Desktop Publication Menus */}
        <nav
          aria-label="Publication Menus"
          className="hidden lg:flex items-center gap-5 text-sm font-medium overflow-x-auto"
        >
          {/* All Stories: Lime Green */}
          <button
            onClick={() => handleMenuClick('All', true)}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'All'
                ? 'border-[#A3E635] text-[#A3E635] font-semibold'
                : 'border-transparent text-stone-300 hover:text-[#A3E635] hover:border-[#A3E635]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
            <span>All Stories</span>
          </button>

          {/* Dynamic Publication Menus: News, Features, Opinion, Sports, Announcements */}
          {menuCategories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => handleMenuClick(cat.name, true)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'font-semibold' : 'border-transparent text-stone-300 hover:opacity-90'
                }`}
                style={
                  isActive
                    ? { borderColor: cat.color, color: cat.color }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action buttons & Cloud Auth status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Auto-Sync live status indicator */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
              syncStatus === 'syncing'
                ? 'text-amber-300 bg-amber-950/50 border-amber-700/60'
                : syncStatus === 'error'
                  ? 'text-rose-300 bg-rose-950/50 border-rose-700/60'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
            }`}
            title={
              autoSyncEnabled
                ? `Auto-Sync Active: Preview changes automatically save and sync to the live published portal${lastSyncedAt ? ` (Last synced ${lastSyncedAt})` : ''}`
                : 'Auto-Sync paused (open Editorial Desk to sync manually)'
            }
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
            ) : (
              <Cloud className="w-3 h-3" />
            )}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'syncing'
                  ? 'bg-amber-300 animate-pulse'
                  : syncStatus === 'error'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="hidden md:inline">
              {syncStatus === 'syncing'
                ? 'Auto-Saving...'
                : autoSyncEnabled
                  ? 'Auto-Sync Live'
                  : 'Sync Paused'}
            </span>
          </div>

          {/* Staff Firebase Auth Login / Signed-In Session Controls */}
          {userProfile ? (
            <div className="inline-flex items-center gap-1 rounded bg-[#4A0E17] border border-[#D4AF37]/40 pl-1.5 pr-1 py-1 shrink-0">
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-100 hover:text-[#F3C562] transition-colors cursor-pointer"
                title={`Signed in as ${userProfile.displayName || userProfile.email} (${userProfile.role})`}
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'Staff'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-[#D4AF37]"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[#34070E] text-[#F3C562] text-[10px] font-bold flex items-center justify-center border border-[#D4AF37]/50">
                    {(userProfile.displayName || 'S').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden xl:inline max-w-[116px] truncate">
                  {activeRoleConfig?.shortTitle || (userProfile.displayName || 'Staff').split(' ')[0]}
                </span>
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-100 hover:text-[#F3C562] bg-[#4A0E17] hover:bg-[#5C1521] border border-[#6B1420] hover:border-[#D4AF37]/60 rounded transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              title="Staff Login with School / Editorial Role Credentials"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Login</span>
            </button>
          )}

          <button
            onClick={onOpenEditorialDesk}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer ${
              isAuthorizedStaff
                ? 'text-[#F3C562] bg-[#5C1521] border border-[#D4AF37]/50 ring-1 ring-[#D4AF37]/20 hover:bg-[#6D1A28]'
                : 'text-[#F3C562] bg-[#4A0E17] border border-[#6B1420] hover:bg-[#5C1521]'
            }`}
            title={
              activeRoleConfig
                ? `Open ${activeRoleConfig.title} Workspace`
                : 'Editorial Board Management Console'
            }
          >
            {isAuthorizedStaff ? (
              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
            <span className="hidden sm:inline">
              {activeRoleConfig
                ? activeRoleConfig.id === 'publication-adviser'
                  ? 'Adviser Portal'
                  : `${activeRoleConfig.shortTitle} Desk`
                : 'Editorial Desk'}
            </span>
            <span className="sm:hidden">Desk</span>
            {pendingSubmissionsCount > 0 && (
              <span className="ml-0.5 text-[10px] font-bold bg-[#D4AF37] text-stone-900 px-1.5 py-0.2 rounded-full">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSubmit}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-stone-900 bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
          >
            Submit Story
          </button>
        </div>
      </div>

      {/* Responsive Publication Menus Bar for screens below lg (<1024px) so menus are always visible */}
      <div className="lg:hidden border-t border-[#58111A]/80 bg-[#2A050B]/95 px-4 py-2 overflow-x-auto scrollbar-none">
        <nav
          aria-label="Mobile Publication Menus"
          className="flex items-center gap-4 text-xs font-medium min-w-max mx-auto"
        >
          <button
            onClick={() => handleMenuClick('All', true)}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'All'
                ? 'border-[#A3E635] text-[#A3E635] font-bold'
                : 'border-transparent text-stone-300 hover:text-[#A3E635]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
            <span>All Stories</span>
          </button>

          {menuCategories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => handleMenuClick(cat.name, true)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'font-bold' : 'border-transparent text-stone-300 hover:text-white'
                }`}
                style={
                  isActive
                    ? { borderColor: cat.color, color: cat.color }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
