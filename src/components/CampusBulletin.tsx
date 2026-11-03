import React, { useState } from 'react';
import { Bell, ChevronRight, Calendar, MapPin, X, AlertTriangle, Edit3, CheckCircle2 } from 'lucide-react';
import { Announcement } from '../types';

interface CampusBulletinProps {
  announcements: Announcement[];
  onSelectAnnouncement?: (ann: Announcement) => void;
  onUpdateAnnouncement?: (id: string, updated: Partial<Announcement>) => void;
}

export const CampusBulletin: React.FC<CampusBulletinProps> = ({
  announcements,
  onUpdateAnnouncement,
}) => {
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<Announcement['type']>('Academic');
  const [editDeadline, setEditDeadline] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUrgent, setEditUrgent] = useState(false);
  const [editContent, setEditContent] = useState('');

  const pinnedNotices = announcements.filter((a) => a.isPinned);
  const displayNotices = pinnedNotices.length > 0 ? pinnedNotices : announcements.slice(0, 2);

  const handleOpenNotice = (notice: Announcement) => {
    setSelectedNotice(notice);
    setIsEditing(false);
  };

  const handleStartEdit = (notice: Announcement) => {
    setEditTitle(notice.title);
    setEditType(notice.type);
    setEditDeadline(notice.deadline || '');
    setEditLocation(notice.location || '');
    setEditUrgent(Boolean(notice.urgent || notice.isPinned));
    setEditContent(notice.content);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice || !editTitle.trim() || !editContent.trim()) return;
    const updatedFields: Partial<Announcement> = {
      title: editTitle.trim(),
      type: editType,
      deadline: editDeadline.trim() || undefined,
      location: editLocation.trim() || undefined,
      urgent: editUrgent,
      isPinned: editUrgent,
      content: editContent.trim(),
    };
    onUpdateAnnouncement?.(selectedNotice.id, updatedFields);
    setSelectedNotice({
      ...selectedNotice,
      ...updatedFields,
    });
    setIsEditing(false);
  };

  return (
    <>
      <div className="bg-[#2A050A] text-white border-y border-[#450C13]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                  className="group inline-flex items-center gap-1.5 text-stone-200 hover:text-white transition-colors text-left cursor-pointer"
                >
                  {notice.urgent && (
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded">
                      Urgent
                    </span>
                  )}
                  <span className="font-medium group-hover:underline underline-offset-2">
                    {notice.title}
                  </span>
                  <span className="text-stone-400">({notice.deadline || notice.date})</span>
                  <ChevronRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
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

      {/* Notice Detail & Edit Dialog */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-stone-200 text-[#1C1917]">
            {!isEditing ? (
              <>
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

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  {onUpdateAnnouncement ? (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(selectedNotice)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#0B2545] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit {selectedNotice.type} Notice</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => setSelectedNotice(null)}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors cursor-pointer"
                  >
                    Close Notice
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#0B2545]" />
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Edit {editType} Notice
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1 rounded text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Notice Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Notice Category
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as Announcement['type'])}
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none font-medium"
                    >
                      <option value="Academic">Academic Notice</option>
                      <option value="Press">Press Conference</option>
                      <option value="Event">Campus Event</option>
                      <option value="Urgent">Urgent / Safety</option>
                      <option value="General">General Notice</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Effective Date / Deadline
                    </label>
                    <input
                      type="text"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      placeholder="e.g. November 6–7, 2026"
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. BNHS Classrooms"
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={editUrgent}
                      onChange={(e) => setEditUrgent(e.target.checked)}
                      className="rounded border-stone-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Pin to Top as Urgent / Priority Bulletin</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Notice Details & Instructions *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Notice Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

