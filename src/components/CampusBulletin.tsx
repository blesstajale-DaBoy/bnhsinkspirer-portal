import React, { useState } from 'react';
import { Bell, ChevronRight, Calendar, MapPin, X, AlertTriangle } from 'lucide-react';
import { Announcement } from '../types';

interface CampusBulletinProps {
  announcements: Announcement[];
  onSelectAnnouncement?: (ann: Announcement) => void;
}

export const CampusBulletin: React.FC<CampusBulletinProps> = ({
  announcements,
}) => {
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  const pinnedNotices = announcements.filter((a) => a.isPinned);
  const displayNotices = pinnedNotices.length > 0 ? pinnedNotices : announcements.slice(0, 2);

  const handleOpenNotice = (notice: Announcement) => {
    setSelectedNotice(notice);
  };

  return (
    <>
      <div className="bg-[#2A050A] text-white border-y border-[#450C13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
            {/* Left Tag */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-xs tracking-wider uppercase text-[#D4AF37]">
                Campus Dispatch & Notices:
              </span>
            </div>

            {/* Notice Items */}
            <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              {displayNotices.map((notice) => (
                <button
                  key={notice.id}
                  onClick={() => handleOpenNotice(notice)}
                  className="group inline-flex flex-wrap items-center gap-1.5 text-stone-200 hover:text-white transition-colors text-left cursor-pointer py-0.5"
                >
                  {notice.urgent && (
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded shrink-0">
                      Urgent
                    </span>
                  )}
                  <span className="font-medium group-hover:underline underline-offset-2">
                    {notice.title}
                  </span>
                  <span className="text-stone-400 text-[11px]">({notice.deadline || notice.date})</span>
                  <ChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>

            {/* Badge for total */}
            <div className="text-[11px] text-stone-400 shrink-0 hidden lg:block">
              {announcements.length} active notices
            </div>
          </div>
        </div>
      </div>

      {/* Notice Detail Dialog */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 sm:p-6 border border-stone-200 text-[#1C1917] max-h-[88dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#133E87] mb-1">
                  {selectedNotice.urgent && (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" /> Urgent Notice
                    </span>
                  )}
                  <span>{selectedNotice.type} Notice</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 leading-snug">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 bg-stone-50 p-3.5 rounded border border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Published: {selectedNotice.date}</span>
                {selectedNotice.deadline && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-stone-800">
                      Effective: {selectedNotice.deadline}
                    </span>
                  </>
                )}
              </div>
              {selectedNotice.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-500" />
                  <span>Venue: {selectedNotice.location}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line mb-6">
              {selectedNotice.content}
            </p>

            <div className="flex items-center justify-end pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

