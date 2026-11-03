import React from 'react';
import {
  X,
  Download,
  FileCode,
  CheckCircle,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Article, Announcement } from '../types';
import { downloadStandaloneWebsiteHtml } from '../utils/exporter';
import { InkspirerLogo } from './InkspirerLogo';

interface DownloadPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  announcements: Announcement[];
  onOpenEditorialDesk: () => void;
}

export const DownloadPortalModal: React.FC<DownloadPortalModalProps> = ({
  isOpen,
  onClose,
  articles,
  announcements,
  onOpenEditorialDesk,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    downloadStandaloneWebsiteHtml(articles, announcements);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex justify-center p-3 sm:p-6">
      <div className="bg-white text-[#1C1917] w-full max-w-xl rounded-lg shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#4A0E17] text-white p-6 flex items-start justify-between border-b border-[#6B1420]">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
              alt="BNHS Logo"
              className="w-12 h-12 object-contain rounded-full border border-[#D4AF37]/80 bg-white/10 p-0.5 shadow-md"
            />
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#D4AF37] mb-1">
                Barobo National High School
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight">
                Download The Inkspirer Portal
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                Standalone responsive website package ready for offline preview
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* File Card info (recreating prompt card) */}
          <div className="border border-stone-200 rounded-lg p-5 bg-[#FBF9F5] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-[#0B2545] text-[#D4AF37] flex items-center justify-center font-mono font-bold text-sm shrink-0">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <div className="font-brand font-bold text-base text-[#0B2545]">
                  The Inkspirer Website
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  HTML · Responsive design · ~18 KB (Zero dependencies required)
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Works in Microsoft Edge, Google Chrome, Safari, and Firefox
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-2 shrink-0 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>

          {/* What's included checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
              What’s Included in The Package?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Five categories: News, Features, Opinion, Sports, & Announcements</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Search & filters to find stories by keyword or beat</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Featured stories homepage layout highlighting campus press</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Story submission form generating downloadable .txt manuscript</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Mobile-friendly responsive layout for phones & desktop</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>School branding: Navy blue (#0B2545), gold (#D4AF37), editorial serif</span>
              </div>
            </div>
          </div>

          {/* Live Editorial Upgrade Callout */}
          <div className="border border-blue-200 bg-blue-50/70 rounded-lg p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#133E87] mb-1">
              <Sparkles className="w-4 h-4 text-[#133E87]" />
              <span>Editorial Board & Publication Adviser Upgrade</span>
            </div>
            <h4 className="font-serif font-bold text-base text-stone-900 mb-1">
              Administrator-Managed Live Portal
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Your publication adviser and authorized student editors can log in to the
              <strong> Editorial Desk</strong> right inside this application to review student submissions,
              publish articles, upload photos, edit announcements, and manage the masthead—all without editing code!
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenEditorialDesk();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#133E87] hover:bg-[#0B2545] rounded transition-colors inline-flex items-center gap-1.5"
            >
              <span>Access Editorial Desk Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
