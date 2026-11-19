import React from 'react';
import { Category, PublicationCategory, PublicationEditionConfig } from '../types';
import { Feather, Shield, BookOpen } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';
import { InkspirerLogo } from './InkspirerLogo';

interface FooterProps {
  onSelectCategory: (cat: Category | 'All') => void;
  onOpenSubmit: () => void;
  onOpenEditorialDesk: () => void;
  categories?: PublicationCategory[];
  editionConfig?: PublicationEditionConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenSubmit,
  onOpenEditorialDesk,
  categories,
  editionConfig,
}) => {
  const currentMotto = editionConfig?.motto || '“Ideas in ink. Voices in motion.”';

  return (
    <footer className="bg-[#240408] text-stone-300 border-t border-[#450C13]">
      {/* Interactive Digital Email Newsletter Signup Component */}
      <NewsletterSignup />

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto pt-10 sm:pt-14 pb-8 sm:pb-10 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-white/10">
          {/* Col 1: Brand & School Lockup (5 cols) */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
                alt="Barobo National High School Seal"
                className="w-11 h-11 object-contain rounded-full border border-[#D4AF37]/80 bg-white/5 p-0.5 shadow-md"
              />
              <InkspirerLogo size="md" />
            </div>
            <div className="font-brand text-2xl font-bold tracking-tight text-white">
              THE INKSPIRER
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
              BAROBO NATIONAL HIGH SCHOOL
            </div>
            <p className="font-serif italic text-sm text-stone-300 leading-relaxed max-w-sm">
              {currentMotto}
            </p>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm pt-1">
              The official digital newsletter and student publication of Barobo National High School. Fostering truthful, courageous, and community-centered campus journalism across Surigao del Sur.
            </p>
            <div className="pt-2 text-xs text-stone-400 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Recognized under RA 7079 · DepEd Region XIII</span>
            </div>
          </div>

          {/* Col 2: Publication Desks / Menus with requested distinct colors (3 cols) */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Publication Menus
            </div>
            <ul className="space-y-2 text-xs">
              {/* All Stories: Lime Green */}
              <li>
                <button
                  onClick={() => onSelectCategory('All')}
                  className="flex items-center gap-2 text-stone-300 hover:text-[#A3E635] transition-colors group text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#84CC16] shrink-0" />
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    All Stories & Front Page
                  </span>
                </button>
              </li>

              {/* Dynamic categories */}
              {(categories && categories.length > 0
                ? categories
                : [
                    { id: 'c1', name: 'News', color: '#FB923C' },
                    { id: 'c2', name: 'Features', color: '#38BDF8' },
                    { id: 'c3', name: 'Opinion', color: '#D4AF37' },
                    { id: 'c4', name: 'Sports', color: '#FACC15' },
                    { id: 'c5', name: 'Announcements', color: '#C084FC' },
                  ]
              ).map((cat) => (
                <li key={cat.id || cat.name}>
                  <button
                    onClick={() => onSelectCategory(cat.name)}
                    className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors group text-left"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {cat.name} Desk
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Student Tools & Portal Links (4 cols) */}
          <div className="sm:col-span-1 lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Student Writers & Management
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Aspiring student journalists can submit articles for review or export downloadable manuscripts.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onOpenSubmit}
                className="w-full min-h-[42px] text-left px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-between gap-2 text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Feather className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>Submit a Story Proposal</span>
                </span>
                <span className="text-[11px] text-stone-400 shrink-0">Export .txt</span>
              </button>

              <button
                onClick={onOpenEditorialDesk}
                className="w-full min-h-[42px] text-left px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-between gap-2 text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>Editorial Desk & Adviser Portal</span>
                </span>
                <span className="text-[11px] text-[#D4AF37] shrink-0">Manage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits Strip with Automatic Dynamic Year */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-stone-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} The Inkspirer · Barobo National High School. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1">
            <span>Poblacion, Barobo, Surigao del Sur 8309</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Region XIII Caraga</span>
          </div>
        </div>

        {/* Developer Attribution Credit */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#E6C687] font-medium tracking-wide">
          The Inkspirer - BNHS Publication Portal developed by: <span className="text-white font-semibold underline decoration-[#D4AF37] underline-offset-4">Bless T. Tajale</span>
        </div>
      </div>
    </footer>
  );
};
