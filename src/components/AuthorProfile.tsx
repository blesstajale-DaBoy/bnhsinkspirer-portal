import React, { useState } from 'react';
import {
  Feather,
  Award,
  BookOpen,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Compass,
  Mail,
  Calendar,
  ArrowUpRight,
  Quote,
  Upload,
  Check,
  X,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Article, StudentAuthorProfile } from '../types';

interface AuthorProfileProps {
  author: string;
  role: string;
  bio?: string;
  avatarSeed?: string;
  photoUrl?: string;
  gradeSection?: string;
  beat?: string;
  journalismMotto?: string;
  accolades?: string[];
  email?: string;
  joinedYear?: string;
  profile?: StudentAuthorProfile | null;
  authorArticles?: Article[];
  currentArticleId?: string;
  onSelectArticle?: (art: Article) => void;
  onUpdateAuthorProfile?: (
    id: string,
    updated: Partial<StudentAuthorProfile>,
    previousName?: string
  ) => void;
  onAddAuthorProfile?: (
    profile: Omit<StudentAuthorProfile, 'id'>
  ) => StudentAuthorProfile;
  onOpenEditorialDeskAuthorTab?: (authorName?: string) => void;
  variant?: 'card' | 'reader-header' | 'reader-card';
  className?: string;
}

// Generate distinct editorial colors based on author name for cohesive personality
export const getAuthorAvatarStyle = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPalettes = [
    { bg: 'bg-[#4A0E17]', text: 'text-[#F3C562]', border: 'border-[#D4AF37]' },
    { bg: 'bg-[#0B2545]', text: 'text-[#93C5FD]', border: 'border-[#60A5FA]' },
    { bg: 'bg-[#064E3B]', text: 'text-[#6EE7B7]', border: 'border-[#34D399]' },
    { bg: 'bg-[#581C87]', text: 'text-[#E9D5FF]', border: 'border-[#C084FC]' },
    { bg: 'bg-[#7C2D12]', text: 'text-[#FED7AA]', border: 'border-[#FB923C]' },
    { bg: 'bg-[#1E293B]', text: 'text-[#FDE047]', border: 'border-[#FACC15]' },
  ];
  return colorPalettes[hash % colorPalettes.length];
};

export const getAuthorInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AuthorProfile: React.FC<AuthorProfileProps> = ({
  author,
  role,
  bio,
  photoUrl,
  gradeSection,
  beat,
  journalismMotto,
  accolades,
  email,
  joinedYear,
  profile,
  authorArticles = [],
  currentArticleId,
  onSelectArticle,
  onUpdateAuthorProfile,
  onAddAuthorProfile,
  onOpenEditorialDeskAuthorTab,
  variant = 'card',
  className = '',
}) => {
  const resolvedName = profile?.name || author;
  const resolvedRole = profile?.role || role || 'Student Journalist';
  const resolvedGrade = profile?.gradeSection || gradeSection || '';
  const resolvedBeat = profile?.beat || beat || 'Campus Journalism Desk';
  const resolvedBio =
    profile?.bio ||
    bio ||
    `Staff writer at Barobo National High School's official student publication, The Inkspirer.`;
  const resolvedPhoto = profile?.photoUrl || photoUrl || '';
  const resolvedMotto = profile?.journalismMotto || journalismMotto || '';
  const resolvedAccolades = profile?.accolades || accolades || [];
  const resolvedEmail = profile?.email || email || '';
  const resolvedJoined = profile?.joinedYear || joinedYear || 'SY 2025–2026';

  const avatarStyle = getAuthorAvatarStyle(resolvedName);
  const initials = getAuthorInitials(resolvedName);

  // Inline editing state for reader-card variant
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState(resolvedName);
  const [editRole, setEditRole] = useState(resolvedRole);
  const [editGrade, setEditGrade] = useState(resolvedGrade || 'Grade 12 HUMSS');
  const [editBeat, setEditBeat] = useState(resolvedBeat);
  const [editBio, setEditBio] = useState(resolvedBio);
  const [editMotto, setEditMotto] = useState(resolvedMotto);
  const [editPhoto, setEditPhoto] = useState(resolvedPhoto);
  const [editEmail, setEditEmail] = useState(resolvedEmail);
  const [editJoined, setEditJoined] = useState(resolvedJoined);
  const [editAccoladesList, setEditAccoladesList] = useState<string[]>(resolvedAccolades);
  const [newAccoladeInput, setNewAccoladeInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleOpenInlineEdit = () => {
    setEditName(resolvedName);
    setEditRole(resolvedRole);
    setEditGrade(resolvedGrade || 'Grade 12 HUMSS');
    setEditBeat(resolvedBeat);
    setEditBio(resolvedBio);
    setEditMotto(resolvedMotto);
    setEditPhoto(resolvedPhoto);
    setEditEmail(resolvedEmail);
    setEditJoined(resolvedJoined);
    setEditAccoladesList(resolvedAccolades);
    setNewAccoladeInput('');
    setIsEditingBio(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAccoladeTag = () => {
    if (!newAccoladeInput.trim()) return;
    setEditAccoladesList((prev) => [...prev, newAccoladeInput.trim()]);
    setNewAccoladeInput('');
  };

  const handleRemoveAccoladeTag = (idx: number) => {
    setEditAccoladesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveInlineBio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editBio.trim()) return;

    const finalAccolades = newAccoladeInput.trim()
      ? [...editAccoladesList, newAccoladeInput.trim()]
      : editAccoladesList;

    if (profile && onUpdateAuthorProfile) {
      onUpdateAuthorProfile(
        profile.id,
        {
          name: editName.trim(),
          role: editRole.trim() || 'Student Journalist',
          gradeSection: editGrade.trim(),
          beat: editBeat.trim(),
          bio: editBio.trim(),
          journalismMotto: editMotto.trim() || undefined,
          photoUrl: editPhoto.trim() || undefined,
          email: editEmail.trim() || undefined,
          joinedYear: editJoined.trim() || undefined,
          accolades: finalAccolades,
        },
        resolvedName
      );
    } else if (onAddAuthorProfile) {
      onAddAuthorProfile({
        name: editName.trim(),
        role: editRole.trim() || 'Student Journalist',
        gradeSection: editGrade.trim() || 'BNHS Student Journalist',
        beat: editBeat.trim() || 'Campus News & Features',
        bio: editBio.trim(),
        journalismMotto: editMotto.trim() || undefined,
        photoUrl: editPhoto.trim() || undefined,
        email: editEmail.trim() || undefined,
        joinedYear: editJoined.trim() || 'SY 2025–2026',
        accolades: finalAccolades,
      });
    }

    setIsEditingBio(false);
    setNewAccoladeInput('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const scrollToFullBioSection = () => {
    const el = document.getElementById('student-journalist-bio-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Variant 1: For StoryCard / LeadStory
  if (variant === 'card') {
    return (
      <div className={`flex items-start gap-2.5 text-left w-full ${className}`}>
        {/* Small Profile Icon / Avatar */}
        <div className="relative shrink-0 mt-0.5">
          {resolvedPhoto ? (
            <img
              src={resolvedPhoto}
              alt={resolvedName}
              className={`w-8 h-8 rounded-full object-cover border ${avatarStyle.border} shadow-xs`}
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full ${avatarStyle.bg} ${avatarStyle.text} border ${avatarStyle.border} flex items-center justify-center font-bold text-xs tracking-wider shadow-xs select-none`}
              title={`${resolvedName} · ${resolvedRole}`}
            >
              {initials}
            </div>
          )}
          <span
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-stone-200"
            title="Verified BNHS Student Journalist"
          >
            <Feather className="w-2.5 h-2.5 text-[#4A0E17]" />
          </span>
        </div>

        {/* Writer Name & Bio Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-stone-900 text-xs truncate max-w-[170px]">
              {resolvedName}
            </span>
            <span className="text-[10px] text-stone-500 font-medium truncate">
              · {resolvedRole}
            </span>
            {resolvedGrade && (
              <span className="text-[10px] text-[#0B2545] font-medium truncate hidden sm:inline">
                ({resolvedGrade})
              </span>
            )}
          </div>
          {/* Short Bio */}
          <p
            className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed mt-0.5 font-normal"
            title={resolvedBio}
          >
            {resolvedBio}
          </p>
        </div>
      </div>
    );
  }

  // Variant 2: For ArticleReaderModal Header Byline
  if (variant === 'reader-header') {
    return (
      <div className={`flex items-center gap-3 text-left ${className}`}>
        {/* Small Profile Icon / Avatar */}
        <div className="relative shrink-0">
          {resolvedPhoto ? (
            <img
              src={resolvedPhoto}
              alt={resolvedName}
              className={`w-11 h-11 rounded-full object-cover border-2 ${avatarStyle.border} shadow-sm`}
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} border-2 ${avatarStyle.border} flex items-center justify-center font-bold text-sm tracking-wider shadow-sm select-none`}
            >
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-stone-200">
            <Feather className="w-3 h-3 text-[#4A0E17]" />
          </span>
        </div>

        {/* Name, Role, Grade & Bio snippet */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-900 text-sm">{resolvedName}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A0E17] bg-[#4A0E17]/10 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-[#4A0E17]" />
              {resolvedRole}
            </span>
            {resolvedGrade && (
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                {resolvedGrade}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">{resolvedBio}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={scrollToFullBioSection}
              className="text-[11px] font-semibold text-[#133E87] hover:text-[#4A0E17] transition-colors inline-flex items-center gap-1"
            >
              <span>View Full Journalist Bio Profile</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Variant 3: Dedicated "Student Journalist Author Bio Profile" Section in Article View
  const otherStories = authorArticles.filter((a) => a.id !== currentArticleId);

  return (
    <section
      id="student-journalist-bio-section"
      aria-label="Student Journalist Author Bio Profile"
      className={`rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden ${className}`}
    >
      {/* Top Institutional Kicker Bar */}
      <div className="bg-[#0B2545] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#07192F]">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-[#F3C562]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#F3C562]">
            Student Journalist Bio Profile
          </span>
          <span aria-hidden="true" className="text-stone-400">·</span>
          <span className="text-xs text-stone-200 hidden sm:inline">
            The Inkspirer Official Roster
          </span>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="text-[11px] font-semibold bg-emerald-700 text-white px-2.5 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Bio Profile Updated</span>
            </span>
          )}

          {(onUpdateAuthorProfile || onAddAuthorProfile) && !isEditingBio && (
            <button
              type="button"
              onClick={handleOpenInlineEdit}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#0B2545] bg-[#F3C562] hover:bg-[#D4AF37] rounded transition-colors flex items-center gap-1"
              title="Edit this student journalist's bio profile"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Author Bio</span>
            </button>
          )}

          {onOpenEditorialDeskAuthorTab && (
            <button
              type="button"
              onClick={() => onOpenEditorialDeskAuthorTab(resolvedName)}
              className="px-2.5 py-1 text-[11px] font-medium text-stone-200 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-1"
              title="Open Student Journalist Bio Directory in Editorial Desk"
            >
              <UserCheck className="w-3 h-3 text-[#F3C562]" />
              <span className="hidden sm:inline">Manage All Bios</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Bio Profile Editor Form */}
      {isEditingBio ? (
        <form onSubmit={handleSaveInlineBio} className="p-5 sm:p-6 bg-[#FBF9F5] space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <div>
              <h4 className="font-serif text-base font-bold text-stone-900">
                Edit Student Journalist Bio Profile
              </h4>
              <p className="text-xs text-stone-500">
                Changes automatically sync to this article and all published stories by this student journalist.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingBio(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Student Journalist Full Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 font-medium focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Publication Role / Title *
              </label>
              <input
                type="text"
                required
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="e.g., Editor-in-Chief, Associate Editor, Staff Writer"
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Grade Level & Section
              </label>
              <input
                type="text"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                placeholder="e.g., Grade 12 HUMSS - Rizal"
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Primary Journalism Beat / Desk
              </label>
              <input
                type="text"
                value={editBeat}
                onChange={(e) => setEditBeat(e.target.value)}
                placeholder="e.g., News & Investigative Reporting"
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Official DepEd / Campus Email
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="student@bnhs.deped.edu.ph"
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                School Year Joined
              </label>
              <input
                type="text"
                value={editJoined}
                onChange={(e) => setEditJoined(e.target.value)}
                placeholder="e.g., SY 2024–2025"
                className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Author Biography *
            </label>
            <textarea
              rows={3}
              required
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Write a concise third-person biography describing the student journalist's beat, interests, and accomplishments..."
              className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-stone-900 leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Personal Journalism Motto / Quote (Optional)
            </label>
            <input
              type="text"
              value={editMotto}
              onChange={(e) => setEditMotto(e.target.value)}
              placeholder="e.g., Writing truth with courage and compassion for every Barobohan learner."
              className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 italic focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
            />
          </div>

          {/* Press Conference Accolades */}
          <div className="text-xs space-y-2">
            <label className="block font-semibold text-stone-700">
              Press Conference Awards & Accolades (DSPC / RSPC / NSPC)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAccoladeInput}
                onChange={(e) => setNewAccoladeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAccoladeTag();
                  }
                }}
                placeholder="e.g., 1st Place News Writing — DSPC 2026"
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAccoladeTag}
                className="px-3 py-1.5 bg-[#0B2545] text-white font-semibold rounded hover:bg-[#133E87] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Award</span>
              </button>
            </div>
            {editAccoladesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {editAccoladesList.map((acc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium"
                  >
                    <Award className="w-3 h-3 text-[#D4AF37]" />
                    <span>{acc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccoladeTag(idx)}
                      className="text-stone-400 hover:text-red-600 ml-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Portrait Photo Upload or URL */}
          <div className="text-xs bg-white p-3 rounded border border-stone-200 space-y-2">
            <label className="font-semibold text-stone-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#133E87]" />
              <span>Journalist Portrait Photo (Optional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0B2545] file:text-white"
              />
              <span className="text-stone-400">or</span>
              <input
                type="text"
                value={editPhoto}
                onChange={(e) => setEditPhoto(e.target.value)}
                placeholder="Paste portrait photo URL..."
                className="w-full px-2.5 py-1 border border-stone-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsEditingBio(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 bg-stone-200/70 hover:bg-stone-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#6B1420] rounded transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 text-[#F3C562]" />
              <span>Save Author Bio Profile</span>
            </button>
          </div>
        </form>
      ) : (
        /* Main Author Profile Card View */
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Profile Portrait or Monogram */}
            <div className="relative shrink-0">
              {resolvedPhoto ? (
                <img
                  src={resolvedPhoto}
                  alt={resolvedName}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 ${avatarStyle.border} shadow-md`}
                />
              ) : (
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${avatarStyle.bg} ${avatarStyle.text} border-2 ${avatarStyle.border} flex items-center justify-center font-bold text-xl sm:text-2xl tracking-wider shadow-md select-none`}
                >
                  {initials}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-stone-900 rounded-full p-1.5 shadow-xs border-2 border-white"
                title="Verified BNHS Campus Journalist"
              >
                <Feather className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bio Details & Metadata */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-serif text-xl font-bold text-stone-900 leading-snug">
                    {resolvedName}
                  </h4>
                  <span className="text-xs font-bold text-[#4A0E17] bg-[#4A0E17]/10 border border-[#4A0E17]/20 px-2.5 py-0.5 rounded-full">
                    {resolvedRole}
                  </span>
                </div>

                {/* Metadata Badges: Grade Section, Beat, Joined Year */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1.5">
                  {resolvedGrade && (
                    <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                      <GraduationCap className="w-3.5 h-3.5 text-[#133E87]" />
                      <span>{resolvedGrade}</span>
                    </span>
                  )}
                  {resolvedBeat && (
                    <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                      <Compass className="w-3.5 h-3.5 text-[#4A0E17]" />
                      <span>{resolvedBeat}</span>
                    </span>
                  )}
                  {resolvedJoined && (
                    <span className="inline-flex items-center gap-1 text-stone-500">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Member since {resolvedJoined}</span>
                    </span>
                  )}
                  {resolvedEmail && (
                    <span className="inline-flex items-center gap-1 text-stone-500 font-mono text-[11px]">
                      <Mail className="w-3 h-3 text-stone-400" />
                      <span>{resolvedEmail}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Full Biography */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                {resolvedBio}
              </p>

              {/* Personal Journalism Motto */}
              {resolvedMotto && (
                <div className="bg-[#FBF9F5] border border-stone-200/90 rounded-lg px-3.5 py-2.5 flex items-start gap-2.5">
                  <Quote className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="font-serif italic text-xs sm:text-sm text-stone-800 leading-relaxed">
                    “{resolvedMotto}”
                  </p>
                </div>
              )}

              {/* Press Conference Accolades & Credentials */}
              {resolvedAccolades.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Press Conference Honors & Journalism Credentials
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedAccolades.map((acc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50/90 border border-amber-200/90 text-stone-800 text-[11px] font-medium"
                      >
                        <Award className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{acc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* More Published Stories by this Student Journalist */}
          {otherStories.length > 0 && (
            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#133E87]" />
                  <span>
                    More Published Stories by {resolvedName} ({otherStories.length})
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {otherStories.slice(0, 4).map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => onSelectArticle?.(story)}
                    className="text-left p-3 rounded-lg border border-stone-200 bg-[#FBF9F5]/60 hover:bg-stone-100/80 hover:border-stone-300 transition-all group flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#133E87]">
                        {story.category} · {story.date}
                      </div>
                      <div className="font-serif text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#4A0E17] transition-colors line-clamp-1 mt-0.5">
                        {story.title}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-[#4A0E17] shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Institutional Accreditation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-3 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-stone-600 font-medium">
                <BookOpen className="w-3 h-3 text-[#D4AF37]" />
                The Inkspirer Student Publication
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Barobo National High School</span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-emerald-700 font-medium">DepEd Region XIII Caraga</span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {authorArticles.length}{' '}
              {authorArticles.length === 1 ? 'published article' : 'published articles'} on portal
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
