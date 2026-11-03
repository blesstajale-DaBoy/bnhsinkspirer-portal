import React, { useState, useMemo } from 'react';
import {
  Feather,
  PlusCircle,
  Edit3,
  Trash2,
  Award,
  BookOpen,
  GraduationCap,
  Compass,
  Mail,
  Calendar,
  Search,
  Upload,
  CheckCircle2,
  X,
  Plus,
  Quote,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Article, StudentAuthorProfile } from '../types';
import { getAuthorAvatarStyle, getAuthorInitials } from './AuthorProfile';

interface AuthorBioManagerProps {
  authorProfiles: StudentAuthorProfile[];
  articles: Article[];
  onAddAuthorProfile: (
    profile: Omit<StudentAuthorProfile, 'id'>
  ) => StudentAuthorProfile;
  onUpdateAuthorProfile: (
    id: string,
    updated: Partial<StudentAuthorProfile>,
    previousName?: string
  ) => void;
  onDeleteAuthorProfile: (id: string) => void;
  onAssignAuthorToComposer?: (profile: StudentAuthorProfile) => void;
  onShowToast?: (msg: string) => void;
}

const ROLE_PRESETS = [
  'Editor-in-Chief',
  'Associate Editor',
  'Managing Editor',
  'News Editor',
  'Feature Editor',
  'Opinion & Editorial Writer',
  'Sports Editor',
  'Chief Photojournalist',
  'Science & Tech Writer',
  'Staff Writer',
  'Contributing Student Scribe',
];

const BEAT_PRESETS = [
  'News & Investigative Reporting',
  'Features & Science-Environment Desk',
  'Opinion, Columns & Civic Discourse',
  'Sports Coverage & Campus Athletics',
  'Photojournalism & Visual Storytelling',
  'Campus Life & Community Profiles',
  'Announcements & Academic Circulars',
];

export const AuthorBioManager: React.FC<AuthorBioManagerProps> = ({
  authorProfiles,
  articles,
  onAddAuthorProfile,
  onUpdateAuthorProfile,
  onDeleteAuthorProfile,
  onAssignAuthorToComposer,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeatFilter, setSelectedBeatFilter] = useState<string>('All');

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<StudentAuthorProfile | null>(null);
  const [deletingProfile, setDeletingProfile] =
    useState<StudentAuthorProfile | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Staff Writer');
  const [formGrade, setFormGrade] = useState('Grade 12 HUMSS - Rizal');
  const [formBeat, setFormBeat] = useState('News & Investigative Reporting');
  const [formBio, setFormBio] = useState('');
  const [formMotto, setFormMotto] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJoinedYear, setFormJoinedYear] = useState('SY 2025–2026');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formAccolades, setFormAccolades] = useState<string[]>([]);
  const [accoladeInput, setAccoladeInput] = useState('');

  // Detect any article authors who don't yet have a dedicated StudentAuthorProfile
  const unprofiledArticleAuthors = useMemo(() => {
    const profiledNames = new Set(
      authorProfiles.map((p) => p.name.trim().toLowerCase())
    );
    const missingMap = new Map<string, Article>();
    articles.forEach((art) => {
      const key = art.author.trim().toLowerCase();
      if (key && !profiledNames.has(key) && !missingMap.has(key)) {
        missingMap.set(key, art);
      }
    });
    return Array.from(missingMap.values());
  }, [authorProfiles, articles]);

  const uniqueBeats = useMemo(() => {
    const beats = new Set<string>();
    authorProfiles.forEach((p) => {
      if (p.beat) beats.add(p.beat);
    });
    return ['All', ...Array.from(beats)];
  }, [authorProfiles]);

  const filteredProfiles = useMemo(() => {
    return authorProfiles.filter((prof) => {
      if (
        selectedBeatFilter !== 'All' &&
        prof.beat.toLowerCase() !== selectedBeatFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          prof.name.toLowerCase().includes(q) ||
          prof.role.toLowerCase().includes(q) ||
          prof.gradeSection.toLowerCase().includes(q) ||
          prof.beat.toLowerCase().includes(q) ||
          prof.bio.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [authorProfiles, selectedBeatFilter, searchQuery]);

  const handleOpenAddModal = (prefillFromArticle?: Article) => {
    setEditingProfile(null);
    if (prefillFromArticle) {
      setFormName(prefillFromArticle.author);
      setFormRole(prefillFromArticle.authorRole || 'Student Journalist');
      setFormGrade(
        prefillFromArticle.authorGradeSection || 'Grade 11 HUMSS'
      );
      setFormBeat(`${prefillFromArticle.category} Desk`);
      setFormBio(
        prefillFromArticle.authorBio ||
          `Student journalist at Barobo National High School covering ${prefillFromArticle.category.toLowerCase()} stories for The Inkspirer.`
      );
      setFormMotto(prefillFromArticle.authorMotto || '');
      setFormEmail(
        `${prefillFromArticle.author
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`
      );
      setFormJoinedYear('SY 2025–2026');
      setFormPhotoUrl(prefillFromArticle.authorPhotoUrl || '');
      setFormAccolades(prefillFromArticle.authorAccolades || []);
    } else {
      setFormName('');
      setFormRole('Staff Writer');
      setFormGrade('Grade 11 HUMSS - Bonifacio');
      setFormBeat('News & Investigative Reporting');
      setFormBio('');
      setFormMotto('');
      setFormEmail('');
      setFormJoinedYear('SY 2025–2026');
      setFormPhotoUrl('');
      setFormAccolades([]);
    }
    setAccoladeInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: StudentAuthorProfile) => {
    setEditingProfile(prof);
    setFormName(prof.name);
    setFormRole(prof.role);
    setFormGrade(prof.gradeSection || '');
    setFormBeat(prof.beat || '');
    setFormBio(prof.bio || '');
    setFormMotto(prof.journalismMotto || '');
    setFormEmail(prof.email || '');
    setFormJoinedYear(prof.joinedYear || 'SY 2025–2026');
    setFormPhotoUrl(prof.photoUrl || '');
    setFormAccolades(prof.accolades || []);
    setAccoladeInput('');
    setIsModalOpen(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAccolade = () => {
    if (!accoladeInput.trim()) return;
    setFormAccolades((prev) => [...prev, accoladeInput.trim()]);
    setAccoladeInput('');
  };

  const handleRemoveAccolade = (idx: number) => {
    setFormAccolades((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAutoGenerateBioTemplate = () => {
    const nameStr = formName.trim() || 'This student journalist';
    const gradeStr = formGrade.trim() || 'Senior High School learner';
    const roleStr = formRole.trim() || 'staff writer';
    const beatStr = formBeat.trim() || 'campus news and features';
    setFormBio(
      `${gradeStr} learner and ${roleStr.toLowerCase()} at Barobo National High School's official publication, The Inkspirer, specializing in ${beatStr.toLowerCase()} and community storytelling.`
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBio.trim()) return;

    const finalAccolades = accoladeInput.trim()
      ? [...formAccolades, accoladeInput.trim()]
      : formAccolades;

    if (editingProfile) {
      onUpdateAuthorProfile(
        editingProfile.id,
        {
          name: formName.trim(),
          role: formRole.trim() || 'Student Journalist',
          gradeSection: formGrade.trim() || 'BNHS Student Scribe',
          beat: formBeat.trim() || 'Campus News & Features',
          bio: formBio.trim(),
          journalismMotto: formMotto.trim() || undefined,
          email: formEmail.trim() || undefined,
          joinedYear: formJoinedYear.trim() || undefined,
          photoUrl: formPhotoUrl.trim() || undefined,
          accolades: finalAccolades,
        },
        editingProfile.name
      );
      onShowToast?.(
        `Updated author bio profile for ${formName.trim()} and synced published articles!`
      );
    } else {
      onAddAuthorProfile({
        name: formName.trim(),
        role: formRole.trim() || 'Student Journalist',
        gradeSection: formGrade.trim() || 'BNHS Student Scribe',
        beat: formBeat.trim() || 'Campus News & Features',
        bio: formBio.trim(),
        journalismMotto: formMotto.trim() || undefined,
        email:
          formEmail.trim() ||
          `${formName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
        joinedYear: formJoinedYear.trim() || 'SY 2025–2026',
        photoUrl: formPhotoUrl.trim() || undefined,
        accolades: finalAccolades,
      });
      onShowToast?.(
        `Created new Student Journalist Bio Profile for ${formName.trim()}!`
      );
    }

    setIsModalOpen(false);
    setEditingProfile(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingProfile) return;
    onDeleteAuthorProfile(deletingProfile.id);
    onShowToast?.(
      `Removed ${deletingProfile.name}'s bio profile from directory`
    );
    setDeletingProfile(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#4A0E17] mb-0.5 flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>BNHS Campus Journalism Press Corps</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            Student Journalist Author Bio Profiles
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Manage dedicated biographies, beats, grade levels, press conference accolades, and portraits for student journalists. Updates automatically sync to the Article View across all published stories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#6B1420] rounded transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#F3C562]" />
          <span>Add Student Journalist Bio</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Registered Student Scribes
            </div>
            <div className="text-2xl font-serif font-bold text-[#0B2545] mt-0.5">
              {authorProfiles.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0B2545]/10 text-[#0B2545] flex items-center justify-center">
            <Feather className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Published Story Bylines
            </div>
            <div className="text-2xl font-serif font-bold text-[#4A0E17] mt-0.5">
              {articles.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              DSPC / RSPC / NSPC Honors
            </div>
            <div className="text-2xl font-serif font-bold text-amber-800 mt-0.5">
              {authorProfiles.reduce(
                (acc, p) => acc + (p.accolades?.length || 0),
                0
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Alert for any article authors without a dedicated profile */}
      {unprofiledArticleAuthors.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#4A0E17] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#991B1B]" />
              <span>
                Unregistered Article Bylines Detected ({unprofiledArticleAuthors.length})
              </span>
            </div>
            <p className="text-xs text-stone-600">
              The following student writers have published articles but do not yet have a full Author Bio Profile card:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unprofiledArticleAuthors.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => handleOpenAddModal(art)}
                className="px-3 py-1.5 text-xs font-semibold text-[#0B2545] bg-white hover:bg-stone-100 border border-amber-300 rounded shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#4A0E17]" />
                <span>Create Bio for {art.author}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Beat Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {uniqueBeats.map((beatName) => (
            <button
              key={beatName}
              type="button"
              onClick={() => setSelectedBeatFilter(beatName)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                selectedBeatFilter === beatName
                  ? 'bg-[#0B2545] text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              {beatName}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journalist, grade, beat..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
          />
        </div>
      </div>

      {/* Student Journalist Author Bio Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="py-12 text-center bg-stone-50 rounded-lg border border-stone-200 space-y-2">
          <p className="text-sm font-serif font-bold text-stone-700">
            No Student Journalist Bio Profiles match your filter.
          </p>
          <p className="text-xs text-stone-500">
            Try clearing your search query or click "Add Student Journalist Bio" above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((prof) => {
            const avatarStyle = getAuthorAvatarStyle(prof.name);
            const initials = getAuthorInitials(prof.name);
            const authoredStories = articles.filter(
              (a) =>
                a.authorProfileId === prof.id ||
                a.author.trim().toLowerCase() === prof.name.trim().toLowerCase()
            );

            return (
              <div
                key={prof.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-stone-400 transition-all shadow-2xs"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Avatar, Name, Role, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {prof.photoUrl ? (
                          <img
                            src={prof.photoUrl}
                            alt={prof.name}
                            className={`w-14 h-14 rounded-full object-cover border-2 ${avatarStyle.border} shadow-sm`}
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-full ${avatarStyle.bg} ${avatarStyle.text} border-2 ${avatarStyle.border} flex items-center justify-center font-bold text-base tracking-wider shadow-sm select-none`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-stone-900 rounded-full p-1 border-2 border-white shadow-2xs">
                          <Feather className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif text-base font-bold text-stone-900 truncate">
                            {prof.name}
                          </h4>
                          <span className="text-[11px] font-bold text-[#4A0E17] bg-[#4A0E17]/10 px-2 py-0.5 rounded">
                            {prof.role}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 mt-1">
                          <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                            <GraduationCap className="w-3 h-3 text-[#133E87]" />
                            {prof.gradeSection}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-stone-600">
                            <Compass className="w-3 h-3 text-[#4A0E17]" />
                            {prof.beat}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prof)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#0B2545] bg-stone-100 hover:bg-[#0B2545] hover:text-white rounded transition-colors flex items-center gap-1"
                        title="Edit Student Journalist Bio Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Bio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProfile(prof)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Bio Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Biography Text */}
                  <p className="text-xs text-stone-700 leading-relaxed bg-[#FBF9F5] p-3 rounded-lg border border-stone-200/80">
                    {prof.bio}
                  </p>

                  {/* Motto if present */}
                  {prof.journalismMotto && (
                    <div className="flex items-start gap-2 text-xs italic font-serif text-stone-600 px-1">
                      <Quote className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>“{prof.journalismMotto}”</span>
                    </div>
                  )}

                  {/* Accolades */}
                  {prof.accolades && prof.accolades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prof.accolades.map((acc, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-stone-800 text-[10px] font-semibold"
                        >
                          <Award className="w-3 h-3 text-[#D4AF37]" />
                          <span>{acc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Authored Stories & Quick Composer Assignment */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="text-stone-600 font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#133E87]" />
                    <span>
                      <strong>{authoredStories.length}</strong>{' '}
                      {authoredStories.length === 1
                        ? 'Published Story'
                        : 'Published Stories'}
                    </span>
                    {prof.joinedYear && (
                      <>
                        <span className="text-stone-300">·</span>
                        <span className="text-stone-500">{prof.joinedYear}</span>
                      </>
                    )}
                  </div>

                  {onAssignAuthorToComposer && (
                    <button
                      type="button"
                      onClick={() => onAssignAuthorToComposer(prof)}
                      className="text-xs font-semibold text-[#133E87] hover:text-[#4A0E17] transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Write New Story as {prof.name.split(' ')[0]}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT STUDENT JOURNALIST BIO PROFILE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-[#0B2545] text-white px-6 py-4 flex items-center justify-between border-b border-[#07192F] shrink-0">
              <div className="flex items-center gap-2.5">
                <Feather className="w-5 h-5 text-[#F3C562]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3C562]">
                    The Inkspirer Student Journalism Roster
                  </div>
                  <h4 className="font-serif font-bold text-lg">
                    {editingProfile
                      ? `Edit Author Bio Profile: ${editingProfile.name}`
                      : 'Create Student Journalist Author Bio Profile'}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="p-6 space-y-4 overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Student Journalist Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Angela Bea S. Claros"
                    className="w-full px-3 py-2 border border-stone-300 rounded font-medium text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Grade Level & Section <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    placeholder="e.g., Grade 11 STEM - Emerald"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              {/* Role & Beat with Preset Quick-Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Editorial Role / Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g., Associate Editor"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ROLE_PRESETS.slice(0, 5).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormRole(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Primary Beat / Journalism Desk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formBeat}
                    onChange={(e) => setFormBeat(e.target.value)}
                    placeholder="e.g., Features & Science-Environment Desk"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {BEAT_PRESETS.slice(0, 3).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormBeat(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 truncate max-w-[160px]"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Official DepEd / Campus Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="student.name@bnhs.deped.edu.ph"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    School Year Inducted
                  </label>
                  <input
                    type="text"
                    value={formJoinedYear}
                    onChange={(e) => setFormJoinedYear(e.target.value)}
                    placeholder="e.g., SY 2024–2025"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              {/* Author Biography */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">
                    Student Journalist Biography <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateBioTemplate}
                    className="text-[11px] font-semibold text-[#133E87] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate BNHS Bio Template</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Describe the student journalist's academic track, reporting beat, press conference background, and advocacy..."
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Journalism Motto */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Personal Journalism Motto / Editorial Quote
                </label>
                <input
                  type="text"
                  value={formMotto}
                  onChange={(e) => setFormMotto(e.target.value)}
                  placeholder="e.g., Our pens carry not just ink, but the authentic lived realities of Barobo scholars."
                  className="w-full px-3 py-2 border border-stone-300 rounded italic text-stone-800 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Press Conference Awards & Accolades */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-700">
                  Press Conference Awards & Journalism Credentials (DSPC / RSPC / NSPC)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={accoladeInput}
                    onChange={(e) => setAccoladeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAccolade();
                      }
                    }}
                    placeholder="e.g., 1st Place Editorial Writing — RSPC 2026"
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded text-stone-900 focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccolade}
                    className="px-3 py-1.5 bg-[#0B2545] text-white font-semibold rounded hover:bg-[#133E87] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Honor</span>
                  </button>
                </div>

                {formAccolades.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formAccolades.map((acc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-stone-800 text-[11px] font-medium"
                      >
                        <Award className="w-3 h-3 text-[#D4AF37]" />
                        <span>{acc}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccolade(idx)}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Portrait Photo Upload */}
              <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 space-y-2.5">
                <label className="font-bold text-stone-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#133E87]" />
                  <span>Student Journalist Portrait Photo (Optional)</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="w-full text-xs text-stone-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0B2545] file:text-white"
                  />
                  <span className="text-stone-400">or</span>
                  <input
                    type="text"
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    placeholder="Paste portrait photo URL..."
                    className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white"
                  />
                </div>
                {formPhotoUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={formPhotoUrl}
                      alt="Portrait preview"
                      className="w-11 h-11 rounded-full object-cover border border-stone-300"
                    />
                    <span className="text-stone-600 text-[11px] flex-1 truncate">
                      Portrait photo attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl('')}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#6B1420] rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F3C562]" />
                  <span>
                    {editingProfile
                      ? 'Save & Sync Bio to Articles'
                      : 'Create Author Bio Profile'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProfile && (
        <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <h4 className="font-serif text-lg font-bold text-stone-900">
              Remove Student Journalist Bio Profile?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove the dedicated Author Bio Profile for{' '}
              <strong className="text-stone-900">{deletingProfile.name}</strong>? Published articles by this writer will remain intact on the portal.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDeletingProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
