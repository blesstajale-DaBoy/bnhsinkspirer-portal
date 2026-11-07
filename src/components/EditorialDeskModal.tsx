import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  FileCheck,
  PlusCircle,
  Megaphone,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
  Upload,
  Lock,
  Unlock,
  Eye,
  Download,
  RotateCcw,
  Sparkles,
  Mail,
  Tag,
  Tags,
  Palette,
  Image as ImageIcon,
  Trophy,
  Feather,
  Newspaper,
  Camera,
  BookOpen,
  Globe,
  Flame,
  Heart,
  AlertTriangle,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
} from 'lucide-react';
import {
  Article,
  Announcement,
  StorySubmission,
  EditorialMember,
  Category,
  NewsletterSubscriber,
  PublicationCategory,
  PortalAdviserConfig,
  AdviserHandoverRecord,
  StudentAuthorProfile,
  PublicationEditionConfig,
  generateIssnForVolumeIssue,
  generateRandomElectronicIssn,
} from '../types';
import { downloadSubmissionTextFile } from '../utils/exporter';
import { normalizeImageUrl, handleImageErrorWithDriveFallback } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import { AuthorBioManager } from './AuthorBioManager';
import { InkspirerLogo } from './InkspirerLogo';

// Curated preset palettes for categories
const COLOR_PRESETS = [
  { name: 'Warm Amber / Orange', color: '#FB923C', badgeBg: 'bg-orange-50', badgeText: 'text-orange-900' },
  { name: 'Sky Blue', color: '#38BDF8', badgeBg: 'bg-sky-50', badgeText: 'text-sky-900' },
  { name: 'Imitation Gold', color: '#D4AF37', badgeBg: 'bg-amber-50', badgeText: 'text-amber-900' },
  { name: 'Signal Yellow', color: '#FACC15', badgeBg: 'bg-yellow-50', badgeText: 'text-yellow-900' },
  { name: 'Lilac Purple', color: '#C084FC', badgeBg: 'bg-purple-50', badgeText: 'text-purple-900' },
  { name: 'Emerald Green', color: '#10B981', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-900' },
  { name: 'Rose Red', color: '#F43F5E', badgeBg: 'bg-rose-50', badgeText: 'text-rose-900' },
  { name: 'Indigo Blue', color: '#6366F1', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-900' },
  { name: 'Cyan Teal', color: '#06B6D4', badgeBg: 'bg-cyan-50', badgeText: 'text-cyan-900' },
  { name: 'Crimson / Maroon', color: '#991B1B', badgeBg: 'bg-red-50', badgeText: 'text-red-900' },
];

const ICON_OPTIONS = [
  { id: 'newspaper', label: 'Newspaper', icon: Newspaper },
  { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'feather', label: 'Pen / Feather', icon: Feather },
  { id: 'trophy', label: 'Trophy', icon: Trophy },
  { id: 'megaphone', label: 'Megaphone', icon: Megaphone },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'book', label: 'Book / Literature', icon: BookOpen },
  { id: 'globe', label: 'Globe / World', icon: Globe },
  { id: 'flame', label: 'Flame / Hot', icon: Flame },
  { id: 'heart', label: 'Heart / Feature', icon: Heart },
];

const PRESET_PHOTOS = [
  { label: 'Campus & News', url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80' },
  { label: 'Writing & Literary', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Editorials & Opinions', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sports & Athletics', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80' },
  { label: 'Announcements & Meetings', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
  { label: 'Science & Technology', url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Arts & Culture', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Library & Research', url: 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?auto=format&fit=crop&w=800&q=80' },
];

const CategoryIcon: React.FC<{ name?: string; className?: string }> = ({ name, className = 'w-4 h-4' }) => {
  switch (name?.toLowerCase()) {
    case 'newspaper':
      return <Newspaper className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'feather':
      return <Feather className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'megaphone':
      return <Megaphone className={className} />;
    case 'camera':
      return <Camera className={className} />;
    case 'book':
    case 'bookopen':
      return <BookOpen className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'heart':
      return <Heart className={className} />;
    default:
      return <Tag className={className} />;
  }
};

interface EditorialDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  announcements: Announcement[];
  submissions: StorySubmission[];
  staff: EditorialMember[];
  categories: PublicationCategory[];
  authorProfiles?: StudentAuthorProfile[];
  initialTab?: 'submissions' | 'compose' | 'articles' | 'announcements' | 'categories' | 'staff' | 'author-bios' | 'adviser' | 'subscribers';
  onPublishSubmission: (id: string) => Article | null;
  onUpdateSubmissionStatus: (id: string, status: StorySubmission['status'], feedback?: string) => void;
  onCreateArticle: (art: Omit<Article, 'id' | 'views' | 'likes'>) => Article;
  onUpdateArticle: (art: Article) => void;
  onDeleteArticle: (id: string) => void;
  onAddAnnouncement: (ann: Omit<Announcement, 'id'>) => Announcement;
  onUpdateAnnouncement?: (id: string, updated: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onTogglePinAnnouncement: (id: string) => void;
  onAddCategory: (cat: Omit<PublicationCategory, 'id' | 'slug'>) => PublicationCategory;
  onUpdateCategory: (id: string, updated: Partial<PublicationCategory>) => void;
  onDeleteCategory: (id: string, fallbackCategoryName?: string) => void;
  onAddStaffMember: (member: Omit<EditorialMember, 'id' | 'avatarSeed'>) => EditorialMember;
  onUpdateStaffMember: (id: string, updated: Partial<EditorialMember>) => void;
  onDeleteStaffMember: (id: string) => void;
  onAddAuthorProfile?: (profile: Omit<StudentAuthorProfile, 'id'>) => StudentAuthorProfile;
  onUpdateAuthorProfile?: (id: string, updated: Partial<StudentAuthorProfile>, previousName?: string) => void;
  onDeleteAuthorProfile?: (id: string) => void;
  editionConfig?: PublicationEditionConfig;
  onUpdateEditionConfig?: (updated: Partial<PublicationEditionConfig>, syncLeadStoryIssue?: boolean) => void;
  onViewArticle?: (art: Article) => void;
  onResetDefaults: () => void;
}

export const EditorialDeskModal: React.FC<EditorialDeskModalProps> = ({
  isOpen,
  onClose,
  articles,
  announcements,
  submissions,
  staff,
  categories,
  authorProfiles = [],
  initialTab,
  onPublishSubmission,
  onUpdateSubmissionStatus,
  onCreateArticle,
  onUpdateArticle,
  onDeleteArticle,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onTogglePinAnnouncement,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onAddAuthorProfile,
  onUpdateAuthorProfile,
  onDeleteAuthorProfile,
  editionConfig,
  onUpdateEditionConfig,
  onViewArticle,
  onResetDefaults,
}) => {
  // Firebase Authentication & Role Management
  const {
    currentUser,
    userProfile,
    loginWithGoogle,
    loginAsAdviserDemo,
    updateActiveAdviserSession,
    loginAsEditorDemo,
    logout,
    isAuthorizedStaff,
    isAdviser,
  } = useAuth();

  const [isPinUnlocked, setIsPinUnlocked] = useState(true);
  const isAuthenticated = isAuthorizedStaff || isPinUnlocked || !!userProfile;
  const [pinCode, setPinCode] = useState('');
  const [authError, setAuthError] = useState('');

  const compressUploadedImage = (file: File, onResult: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const rawDataUrl = reader.result;
      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            onResult(compressed);
            return;
          }
        } catch {
          // fallback to raw
        }
        onResult(rawDataUrl);
      };
      img.onerror = () => onResult(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Auto-fill author info based on active logged-in profile
  useEffect(() => {
    if (userProfile?.displayName) {
      setComposerAuthor(userProfile.displayName);
      setComposerRole(
        userProfile.designation ||
          (userProfile.role === 'adviser' ? 'Publication Adviser' : 'Editor-in-Chief')
      );
    }
  }, [userProfile]);

  // Active tab in management desk
  const [activeTab, setActiveTab] = useState<'submissions' | 'compose' | 'articles' | 'announcements' | 'categories' | 'staff' | 'author-bios' | 'adviser' | 'subscribers'>('submissions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [subscribersList, setSubscribersList] = useState<NewsletterSubscriber[]>([]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('the_inkspirer_subscribers_v1');
      if (stored) {
        setSubscribersList(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  }, [activeTab]);

  // Selected submission to review
  const [selectedSubmission, setSelectedSubmission] = useState<StorySubmission | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [deskToast, setDeskToast] = useState('');

  // Article composer state
  const [composerTitle, setComposerTitle] = useState('');
  const [composerDeck, setComposerDeck] = useState('');
  const [composerCategory, setComposerCategory] = useState<Category>('News');
  const [composerAuthor, setComposerAuthor] = useState('John Cedric Morales');
  const [composerRole, setComposerRole] = useState('Editor-in-Chief');
  const [composerAuthorGrade, setComposerAuthorGrade] = useState('Grade 12 HUMSS - Rizal');
  const [composerAuthorBio, setComposerAuthorBio] = useState(
    'Grade 12 HUMSS student, NSPC qualifier, and senior investigative reporter covering school governance, regional press meets, and educational policy at Barobo National High School.'
  );
  const [composerLeadStory, setComposerLeadStory] = useState(false);
  const [composerFeatured, setComposerFeatured] = useState(false);
  const [composerPullQuote, setComposerPullQuote] = useState('');
  const [composerCaption, setComposerCaption] = useState('');
  const [composerImageUrl, setComposerImageUrl] = useState('');
  const [composerContent, setComposerContent] = useState('');

  // Announcement composer state
  const [annTitle, setAnnTitle] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('Academic');
  const [annDeadline, setAnnDeadline] = useState('');
  const [annLocation, setAnnLocation] = useState('');
  const [annUrgent, setAnnUrgent] = useState(false);
  const [annContent, setAnnContent] = useState('');

  // Editing Announcement / Academic Notice state
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnType, setEditAnnType] = useState<Announcement['type']>('Academic');
  const [editAnnDeadline, setEditAnnDeadline] = useState('');
  const [editAnnLocation, setEditAnnLocation] = useState('');
  const [editAnnUrgent, setEditAnnUrgent] = useState(false);
  const [editAnnContent, setEditAnnContent] = useState('');

  // Editing article form state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDeck, setEditDeck] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('News');
  const [editAuthor, setEditAuthor] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAuthorGrade, setEditAuthorGrade] = useState('');
  const [editAuthorBio, setEditAuthorBio] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPullQuote, setEditPullQuote] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLeadStory, setEditLeadStory] = useState(false);
  const [editFeatured, setEditFeatured] = useState(false);
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<Category | 'All'>('All');
  const [articleSearchQuery, setArticleSearchQuery] = useState('');

  // Category management state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PublicationCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<PublicationCategory | null>(null);
  const [deleteFallbackCategory, setDeleteFallbackCategory] = useState<string>('');

  // Add category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#FB923C');
  const [newCatBadgeBg, setNewCatBadgeBg] = useState('bg-orange-50');
  const [newCatBadgeText, setNewCatBadgeText] = useState('text-orange-900');
  const [newCatIcon, setNewCatIcon] = useState('newspaper');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');

  // Edit category form
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatColor, setEditCatColor] = useState('#FB923C');
  const [editCatBadgeBg, setEditCatBadgeBg] = useState('bg-orange-50');
  const [editCatBadgeText, setEditCatBadgeText] = useState('text-orange-900');
  const [editCatIcon, setEditCatIcon] = useState('newspaper');
  const [editCatImageUrl, setEditCatImageUrl] = useState('');

  // Editorial Board & Masthead Roster management state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<EditorialMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<EditorialMember | null>(null);

  // Add staff form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Associate Editor');
  const [newStaffGrade, setNewStaffGrade] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('');
  const [newStaffPhoto, setNewStaffPhoto] = useState('');

  // Edit staff form
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');
  const [editStaffGrade, setEditStaffGrade] = useState('');
  const [editStaffDept, setEditStaffDept] = useState('');
  const [editStaffPhoto, setEditStaffPhoto] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPin, setEditStaffPin] = useState('1991');

  // Portal Adviser Management & Resignation / Succession state
  const [activeAdviserConfig, setActiveAdviserConfig] = useState<PortalAdviserConfig>(() => {
    try {
      const stored = localStorage.getItem('the_inkspirer_active_adviser_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      id: 'staff-1',
      name: 'Mrs. Maria Elena V. Delos Reyes',
      email: 'm.reyes@bnhs.deped.edu.ph',
      role: 'School Publication Adviser',
      designation: 'Master Teacher II - English Department',
      department: 'Adviser & Editorial Consultant',
      pinCode: '1991',
      appointedDate: 'August 2024',
    };
  });

  const [handoverHistory, setHandoverHistory] = useState<AdviserHandoverRecord[]>(() => {
    try {
      const stored = localStorage.getItem('the_inkspirer_adviser_handover_log_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync active adviser name/details if edited in the staff roster
  useEffect(() => {
    const primaryInRoster =
      staff.find((m) => m.id === activeAdviserConfig.id) ||
      staff.find(
        (m) =>
          (m.role.toLowerCase().includes('adviser') || m.role.toLowerCase().includes('consultant')) &&
          !m.role.toLowerCase().includes('former') &&
          !m.role.toLowerCase().includes('emeritus') &&
          !m.role.toLowerCase().includes('resigned')
      );
    if (primaryInRoster && primaryInRoster.name !== activeAdviserConfig.name && primaryInRoster.id === activeAdviserConfig.id) {
      const synced: PortalAdviserConfig = {
        ...activeAdviserConfig,
        name: primaryInRoster.name,
        role: primaryInRoster.role,
        designation: primaryInRoster.gradeOrDesignation,
        department: primaryInRoster.department,
        photoUrl: primaryInRoster.photoUrl,
      };
      setActiveAdviserConfig(synced);
      localStorage.setItem('the_inkspirer_active_adviser_v1', JSON.stringify(synced));
    }
  }, [staff]);

  // Modals for Portal Adviser Resignation / Handover & Adding Portal Adviser
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isAddAdviserModalOpen, setIsAddAdviserModalOpen] = useState(false);
  const [resignDisposition, setResignDisposition] = useState<'emeritus' | 'removed'>('emeritus');
  const [successorMode, setSuccessorMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingSuccessorId, setSelectedExistingSuccessorId] = useState<string>('');
  const [successorName, setSuccessorName] = useState('');
  const [successorEmail, setSuccessorEmail] = useState('');
  const [successorRole, setSuccessorRole] = useState('School Publication Adviser');
  const [successorDesignation, setSuccessorDesignation] = useState('Master Teacher I - Filipino Department');
  const [successorDepartment, setSuccessorDepartment] = useState('Adviser & Editorial Consultant');
  const [successorPin, setSuccessorPin] = useState('1991');
  const [successorPhoto, setSuccessorPhoto] = useState('');
  const [resignReason, setResignReason] = useState(
    'Official turnover of School Publication Advisership duties for The Inkspirer.'
  );

  // Add New Portal Adviser / Co-Adviser standalone form
  const [newAdviserName, setNewAdviserName] = useState('');
  const [newAdviserEmail, setNewAdviserEmail] = useState('');
  const [newAdviserRole, setNewAdviserRole] = useState('Portal Publication Adviser');
  const [newAdviserDesignation, setNewAdviserDesignation] = useState('Master Teacher I - English Department');
  const [newAdviserDepartment, setNewAdviserDepartment] = useState('Adviser & Editorial Consultant');
  const [newAdviserPin, setNewAdviserPin] = useState('1991');
  const [newAdviserPhoto, setNewAdviserPhoto] = useState('');
  const [makePrimaryAdviser, setMakePrimaryAdviser] = useState(true);
  const [lastPublishedArticle, setLastPublishedArticle] = useState<Article | null>(null);
  const [composerError, setComposerError] = useState('');

  // Publication Volume, Issue No., Academic Year, Circulation, ISSN, Motto & Tagline Editor state (kept strictly above early return)
  const currentVolumeIssue = editionConfig?.volumeIssue || 'Vol. XXIV · Issue No. 1';
  const currentAcademicYear = editionConfig?.academicYear || 'Academic Year 2026–2027';
  const currentCirculation = editionConfig?.circulation || 'Circulation: 2,800+ Students & Faculty';
  const currentIssn = editionConfig?.issn || generateIssnForVolumeIssue(currentVolumeIssue);
  const currentMotto = editionConfig?.motto || '“Ideas in ink. Voices in motion.”';
  const currentTaglineDescription =
    editionConfig?.taglineDescription ||
    'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.';

  const [isEditEditionModalOpen, setIsEditEditionModalOpen] = useState(false);
  const [isEditMottoModalOpen, setIsEditMottoModalOpen] = useState(false);
  const [deskVolumeIssue, setDeskVolumeIssue] = useState(currentVolumeIssue);
  const [deskAcademicYear, setDeskAcademicYear] = useState(currentAcademicYear);
  const [deskCirculation, setDeskCirculation] = useState(currentCirculation);
  const [deskIssn, setDeskIssn] = useState(currentIssn);
  const [deskMotto, setDeskMotto] = useState(currentMotto);
  const [deskTaglineDescription, setDeskTaglineDescription] = useState(currentTaglineDescription);
  const [deskIssnAutoNotice, setDeskIssnAutoNotice] = useState(false);
  const [deskSyncLeadIssue, setDeskSyncLeadIssue] = useState(true);

  useEffect(() => {
    setDeskVolumeIssue(currentVolumeIssue);
    setDeskAcademicYear(currentAcademicYear);
    setDeskCirculation(currentCirculation);
    setDeskIssn(currentIssn);
    setDeskMotto(currentMotto);
    setDeskTaglineDescription(currentTaglineDescription);
  }, [
    currentVolumeIssue,
    currentAcademicYear,
    currentCirculation,
    currentIssn,
    currentMotto,
    currentTaglineDescription,
  ]);

  if (!isOpen) return null;

  const handleDeskVolumeIssueChange = (newVolumeIssue: string) => {
    setDeskVolumeIssue(newVolumeIssue);
    const autoIssn = generateIssnForVolumeIssue(newVolumeIssue);
    setDeskIssn(autoIssn);
    setDeskIssnAutoNotice(true);
  };

  const handleSaveEditionFromDesk = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVol = deskVolumeIssue.trim() || 'Vol. XXIV · Issue No. 1';
    const cleanAy = deskAcademicYear.trim() || 'Academic Year 2026–2027';
    const cleanCirc = deskCirculation.trim() || 'Circulation: 2,800+ Students & Faculty';
    const cleanIssn = deskIssn.trim() || generateIssnForVolumeIssue(cleanVol);
    const cleanMotto = deskMotto.trim() || '“Ideas in ink. Voices in motion.”';
    const cleanTagline =
      deskTaglineDescription.trim() ||
      'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.';

    onUpdateEditionConfig?.(
      {
        volumeIssue: cleanVol,
        academicYear: cleanAy,
        circulation: cleanCirc,
        issn: cleanIssn,
        motto: cleanMotto,
        taglineDescription: cleanTagline,
      },
      deskSyncLeadIssue
    );
    setIsEditEditionModalOpen(false);
    setIsEditMottoModalOpen(false);
    setDeskIssnAutoNotice(false);
    showToast(`Updated Publication Settings (${cleanVol} · ${cleanAy})!`);
  };

  const handleSaveMottoFromDesk = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMotto = deskMotto.trim() || '“Ideas in ink. Voices in motion.”';
    const cleanTagline =
      deskTaglineDescription.trim() ||
      'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.';

    onUpdateEditionConfig?.({
      volumeIssue: currentVolumeIssue,
      academicYear: currentAcademicYear,
      circulation: currentCirculation,
      issn: currentIssn,
      motto: cleanMotto,
      taglineDescription: cleanTagline,
    });
    setIsEditMottoModalOpen(false);
    showToast('Updated Publication Motto & Masthead Description!');
  };

  const showToast = (msg: string) => {
    setDeskToast(msg);
    setTimeout(() => setDeskToast(''), 3000);
  };

  const handleOpenAddStaff = () => {
    setNewStaffName('');
    setNewStaffRole('Staff Writer');
    setNewStaffGrade('Grade 12 HUMSS');
    setNewStaffDept('News & Public Affairs Desk');
    setNewStaffPhoto('');
    setIsAddStaffOpen(true);
  };

  const handleOpenAddPortalAdviser = () => {
    setNewAdviserName('');
    setNewAdviserEmail('');
    setNewAdviserRole('School Publication Adviser');
    setNewAdviserDesignation('Master Teacher I - English Department');
    setNewAdviserDepartment('Adviser & Editorial Consultant');
    setNewAdviserPin(activeAdviserConfig.pinCode || '1991');
    setNewAdviserPhoto('');
    setMakePrimaryAdviser(true);
    setIsAddAdviserModalOpen(true);
  };

  const handleOpenResignModal = () => {
    const nonAdviserStaff = staff.filter((m) => m.id !== activeAdviserConfig.id);
    setSelectedExistingSuccessorId(nonAdviserStaff[0]?.id || '');
    setSuccessorName('');
    setSuccessorEmail('');
    setSuccessorRole('School Publication Adviser');
    setSuccessorDesignation('Master Teacher I - English / Filipino Department');
    setSuccessorDepartment('Adviser & Editorial Consultant');
    setSuccessorPin(activeAdviserConfig.pinCode || '1991');
    setSuccessorPhoto('');
    setResignDisposition('emeritus');
    setSuccessorMode('new');
    setIsResignModalOpen(true);
  };

  const handleCreatePortalAdviser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdviserName.trim()) return;

    const createdMember = onAddStaffMember({
      name: newAdviserName.trim(),
      role: newAdviserRole.trim() || 'School Publication Adviser',
      gradeOrDesignation: newAdviserDesignation.trim() || 'Faculty Adviser',
      department: newAdviserDepartment.trim() || 'Adviser & Editorial Consultant',
      photoUrl: normalizeImageUrl(newAdviserPhoto) || undefined,
      email: newAdviserEmail.trim() || `${newAdviserName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
      isPrimaryAdviser: makePrimaryAdviser,
      adviserStatus: 'active',
    });

    if (makePrimaryAdviser) {
      const newConfig: PortalAdviserConfig = {
        id: createdMember.id,
        name: createdMember.name,
        email:
          newAdviserEmail.trim() ||
          `${createdMember.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
        role: createdMember.role,
        designation: createdMember.gradeOrDesignation,
        department: createdMember.department,
        pinCode: newAdviserPin.trim() || '1991',
        photoUrl: createdMember.photoUrl,
        appointedDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      setActiveAdviserConfig(newConfig);
      localStorage.setItem('the_inkspirer_active_adviser_v1', JSON.stringify(newConfig));
      updateActiveAdviserSession({
        name: newConfig.name,
        email: newConfig.email,
        designation: `${newConfig.role} · ${newConfig.designation}`,
        department: newConfig.department,
        photoUrl: newConfig.photoUrl || null,
      });
    }

    setIsAddAdviserModalOpen(false);
    showToast(
      makePrimaryAdviser
        ? `Appointed ${createdMember.name} as Active Portal Adviser!`
        : `Added ${createdMember.name} as Portal Co-Adviser!`
    );
  };

  const handleConfirmResignAndHandover = (e: React.FormEvent) => {
    e.preventDefault();

    const outgoingName = activeAdviserConfig.name;
    const outgoingMember =
      staff.find((m) => m.id === activeAdviserConfig.id) ||
      staff.find((m) => m.name.toLowerCase() === outgoingName.toLowerCase());

    // 1. Update or remove outgoing adviser from staff roster
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (outgoingMember) {
      if (resignDisposition === 'removed') {
        onDeleteStaffMember(outgoingMember.id);
      } else {
        onUpdateStaffMember(outgoingMember.id, {
          role: 'Former Publication Adviser (Emeritus)',
          department: `Stepped Down / Emeritus (${todayFormatted})`,
          isPrimaryAdviser: false,
          adviserStatus: 'emeritus',
          resignedDate: todayFormatted,
        });
      }
    }

    // 2. Appoint or promote the incoming Portal Adviser
    let finalNewAdviser: PortalAdviserConfig;

    if (successorMode === 'existing' && selectedExistingSuccessorId) {
      const existingTarget = staff.find((m) => m.id === selectedExistingSuccessorId);
      if (existingTarget) {
        const updatedRole = successorRole.trim() || 'School Publication Adviser';
        onUpdateStaffMember(existingTarget.id, {
          role: updatedRole,
          gradeOrDesignation: successorDesignation.trim() || existingTarget.gradeOrDesignation,
          department: successorDepartment.trim() || 'Adviser & Editorial Consultant',
          isPrimaryAdviser: true,
          adviserStatus: 'active',
        });

        finalNewAdviser = {
          id: existingTarget.id,
          name: existingTarget.name,
          email:
            successorEmail.trim() ||
            `${existingTarget.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
          role: updatedRole,
          designation: successorDesignation.trim() || existingTarget.gradeOrDesignation,
          department: successorDepartment.trim() || 'Adviser & Editorial Consultant',
          pinCode: successorPin.trim() || '1991',
          photoUrl: existingTarget.photoUrl,
          appointedDate: todayFormatted,
        };
      } else {
        return;
      }
    } else {
      if (!successorName.trim()) return;
      const createdSuccessor = onAddStaffMember({
        name: successorName.trim(),
        role: successorRole.trim() || 'School Publication Adviser',
        gradeOrDesignation: successorDesignation.trim() || 'Master Teacher / Faculty Adviser',
        department: successorDepartment.trim() || 'Adviser & Editorial Consultant',
        photoUrl: successorPhoto.trim() || undefined,
        email:
          successorEmail.trim() ||
          `${successorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
        isPrimaryAdviser: true,
        adviserStatus: 'active',
      });

      finalNewAdviser = {
        id: createdSuccessor.id,
        name: createdSuccessor.name,
        email:
          successorEmail.trim() ||
          `${createdSuccessor.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
        role: createdSuccessor.role,
        designation: createdSuccessor.gradeOrDesignation,
        department: createdSuccessor.department,
        pinCode: successorPin.trim() || '1991',
        photoUrl: createdSuccessor.photoUrl,
        appointedDate: todayFormatted,
      };
    }

    // 3. Persist new active Portal Adviser & update active session
    setActiveAdviserConfig(finalNewAdviser);
    localStorage.setItem('the_inkspirer_active_adviser_v1', JSON.stringify(finalNewAdviser));
    updateActiveAdviserSession({
      name: finalNewAdviser.name,
      email: finalNewAdviser.email,
      designation: `${finalNewAdviser.role} · ${finalNewAdviser.designation}`,
      department: finalNewAdviser.department,
      photoUrl: finalNewAdviser.photoUrl || null,
    });

    // 4. Record in official Adviser Handover & Resignation Log
    const logRecord: AdviserHandoverRecord = {
      id: `handover-${Date.now()}`,
      previousAdviserName: outgoingName,
      previousAdviserDisposition: resignDisposition,
      newAdviserName: finalNewAdviser.name,
      newAdviserDesignation: finalNewAdviser.designation,
      handoverDate: todayFormatted,
      reasonOrNote:
        resignReason.trim() ||
        'Resigned as Publication Adviser and transferred portal administration to successor.',
    };

    const updatedHistory = [logRecord, ...handoverHistory];
    setHandoverHistory(updatedHistory);
    localStorage.setItem('the_inkspirer_adviser_handover_log_v1', JSON.stringify(updatedHistory));

    setIsResignModalOpen(false);
    showToast(
      `${outgoingName} resigned as Adviser. ${finalNewAdviser.name} is now the Active Portal Adviser!`
    );
  };

  const handleSetMemberAsActiveAdviser = (member: EditorialMember) => {
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const updatedRole = member.role.toLowerCase().includes('adviser')
      ? member.role.replace(/former\s+|emeritus|\(emeritus\)/gi, '').trim() || 'School Publication Adviser'
      : 'School Publication Adviser';

    onUpdateStaffMember(member.id, {
      role: updatedRole,
      isPrimaryAdviser: true,
      adviserStatus: 'active',
    });

    const newConfig: PortalAdviserConfig = {
      id: member.id,
      name: member.name,
      email:
        member.email ||
        `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`,
      role: updatedRole,
      designation: member.gradeOrDesignation,
      department: member.department,
      pinCode: activeAdviserConfig.pinCode || '1991',
      photoUrl: member.photoUrl,
      appointedDate: todayFormatted,
    };

    setActiveAdviserConfig(newConfig);
    localStorage.setItem('the_inkspirer_active_adviser_v1', JSON.stringify(newConfig));
    updateActiveAdviserSession({
      name: newConfig.name,
      email: newConfig.email,
      designation: `${newConfig.role} · ${newConfig.designation}`,
      department: newConfig.department,
      photoUrl: newConfig.photoUrl || null,
    });
    showToast(`${member.name} is now set as the Active Portal Adviser!`);
  };

  const handleOpenEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditAnnTitle(ann.title);
    setEditAnnType(ann.type);
    setEditAnnDeadline(ann.deadline || '');
    setEditAnnLocation(ann.location || '');
    setEditAnnUrgent(Boolean(ann.urgent || ann.isPinned));
    setEditAnnContent(ann.content);
  };

  const handleSaveEditAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    if (!editAnnTitle.trim() || !editAnnContent.trim()) {
      showToast('Please provide both a notice title and content.');
      return;
    }
    const updates: Partial<Announcement> = {
      title: editAnnTitle.trim(),
      type: editAnnType,
      deadline: editAnnDeadline.trim(),
      location: editAnnLocation.trim(),
      urgent: editAnnUrgent,
      isPinned: editAnnUrgent,
      content: editAnnContent.trim(),
    };
    onUpdateAnnouncement?.(editingAnnouncement.id, updates);
    showToast(`Updated "${editAnnTitle.trim()}" (${editAnnType} Notice)!`);
    setEditingAnnouncement(null);
  };

  const handleOpenEditStaff = (member: EditorialMember) => {
    const isCurrentAdviser =
      member.id === activeAdviserConfig.id ||
      member.name.toLowerCase() === activeAdviserConfig.name.toLowerCase();
    setEditingStaff(member);
    setEditStaffName(member.name);
    setEditStaffRole(member.role);
    setEditStaffGrade(member.gradeOrDesignation);
    setEditStaffDept(member.department);
    setEditStaffPhoto(member.photoUrl || (isCurrentAdviser ? activeAdviserConfig.photoUrl || '' : ''));
    setEditStaffEmail(
      member.email ||
        (isCurrentAdviser
          ? activeAdviserConfig.email
          : `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`)
    );
    setEditStaffPin(activeAdviserConfig.pinCode || '1991');
  };

  const handleCreateStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffRole.trim()) {
      return;
    }
    onAddStaffMember({
      name: newStaffName.trim(),
      role: newStaffRole.trim(),
      gradeOrDesignation: newStaffGrade.trim() || 'Campus Journalist',
      department: newStaffDept.trim() || 'The Inkspirer Editorial Board',
      photoUrl: normalizeImageUrl(newStaffPhoto) || undefined,
    });
    showToast(`Added ${newStaffName.trim()} to the Editorial Board Roster!`);
    setIsAddStaffOpen(false);
  };

  const handleSaveEditStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editStaffName.trim() || !editStaffRole.trim()) {
      return;
    }
    const cleanName = editStaffName.trim();
    const cleanRole = editStaffRole.trim();
    const cleanGrade = editStaffGrade.trim() || 'Campus Journalist';
    const cleanDept = editStaffDept.trim() || 'The Inkspirer Editorial Board';
    const cleanEmail =
      editStaffEmail.trim() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@bnhs.deped.edu.ph`;
    const cleanPhoto = normalizeImageUrl(editStaffPhoto) || undefined;

    onUpdateStaffMember(editingStaff.id, {
      name: cleanName,
      role: cleanRole,
      gradeOrDesignation: cleanGrade,
      department: cleanDept,
      email: cleanEmail,
      photoUrl: cleanPhoto,
    });

    // If editing the Active Portal Adviser, also update activeAdviserConfig & session
    const isCurrentAdviser =
      editingStaff.id === activeAdviserConfig.id ||
      editingStaff.name.toLowerCase() === activeAdviserConfig.name.toLowerCase();

    if (isCurrentAdviser) {
      const updatedConfig: PortalAdviserConfig = {
        ...activeAdviserConfig,
        id: editingStaff.id,
        name: cleanName,
        email: cleanEmail,
        role: cleanRole,
        designation: cleanGrade,
        department: cleanDept,
        pinCode: editStaffPin.trim() || activeAdviserConfig.pinCode || '1991',
        photoUrl: cleanPhoto,
      };
      setActiveAdviserConfig(updatedConfig);
      try {
        localStorage.setItem('the_inkspirer_active_adviser_v1', JSON.stringify(updatedConfig));
      } catch {
        // ignore
      }
      updateActiveAdviserSession({
        name: updatedConfig.name,
        email: updatedConfig.email,
        designation: `${updatedConfig.role} · ${updatedConfig.designation}`,
        department: updatedConfig.department,
        photoUrl: updatedConfig.photoUrl || null,
      });
    }

    showToast(`Updated ${cleanName}'s profile and credentials!`);
    setEditingStaff(null);
  };

  const handleConfirmDeleteStaff = () => {
    if (!deletingStaff) return;
    onDeleteStaffMember(deletingStaff.id);
    showToast(`Removed ${deletingStaff.name} from the Masthead Roster`);
    setDeletingStaff(null);
  };

  const handleStaffPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      compressUploadedImage(file, (result) => {
        if (isEdit) {
          setEditStaffPhoto(result);
        } else {
          setNewStaffPhoto(result);
        }
      });
    }
  };

  const handleOpenAddCategory = () => {
    setNewCatName('');
    setNewCatDesc('');
    setNewCatColor('#FB923C');
    setNewCatBadgeBg('bg-orange-50');
    setNewCatBadgeText('text-orange-900');
    setNewCatIcon('newspaper');
    setNewCatImageUrl('');
    setIsAddCategoryOpen(true);
  };

  const handleOpenEditCategory = (cat: PublicationCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatColor(cat.color);
    setEditCatBadgeBg(cat.badgeBg || 'bg-stone-50');
    setEditCatBadgeText(cat.badgeText || 'text-stone-900');
    setEditCatIcon(cat.iconName || 'newspaper');
    setEditCatImageUrl(cat.imageUrl || '');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Please enter a category name.');
      return;
    }
    // Check duplicates
    if (categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      showToast(`A category named "${newCatName.trim()}" already exists.`);
      return;
    }

    onAddCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim() || `Articles and stories under the ${newCatName.trim()} desk.`,
      color: newCatColor,
      badgeBg: newCatBadgeBg,
      badgeText: newCatBadgeText,
      iconName: newCatIcon,
      imageUrl: normalizeImageUrl(newCatImageUrl) || undefined,
    });

    showToast(`Created category "${newCatName.trim()}"!`);
    setIsAddCategoryOpen(false);
  };

  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) {
      showToast('Please enter a category name.');
      return;
    }

    onUpdateCategory(editingCategory.id, {
      name: editCatName.trim(),
      description: editCatDesc.trim(),
      color: editCatColor,
      badgeBg: editCatBadgeBg,
      badgeText: editCatBadgeText,
      iconName: editCatIcon,
      imageUrl: normalizeImageUrl(editCatImageUrl) || undefined,
    });

    showToast(`Updated category "${editCatName.trim()}"!`);
    setEditingCategory(null);
  };

  const handleOpenDeleteCategory = (cat: PublicationCategory) => {
    if (categories.length <= 1) {
      showToast('Cannot delete the only remaining publication category.');
      return;
    }
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setDeleteFallbackCategory(otherCats[0]?.name || 'News');
    setDeletingCategory(cat);
  };

  const handleConfirmDeleteCategory = () => {
    if (!deletingCategory) return;
    onDeleteCategory(deletingCategory.id, deleteFallbackCategory);
    showToast(`Deleted category "${deletingCategory.name}"`);
    setDeletingCategory(null);
  };

  const handleCategoryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      compressUploadedImage(file, (result) => {
        if (isEdit) {
          setEditCatImageUrl(result);
        } else {
          setNewCatImageUrl(result);
        }
      });
    }
  };

  const handleOpenEditArticle = (art: Article) => {
    const matchedProf = authorProfiles.find(
      (p) =>
        (art.authorProfileId && p.id === art.authorProfileId) ||
        p.name.trim().toLowerCase() === art.author.trim().toLowerCase()
    );
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditDeck(art.deck || '');
    setEditCategory(art.category);
    setEditAuthor(art.author);
    setEditRole(art.authorRole || matchedProf?.role || '');
    setEditAuthorGrade(art.authorGradeSection || matchedProf?.gradeSection || '');
    setEditAuthorBio(
      art.authorBio ||
        matchedProf?.bio ||
        `Student journalist at Barobo National High School writing for The Inkspirer.`
    );
    setEditContent(Array.isArray(art.content) ? art.content.join('\n\n') : (art.content || ''));
    setEditPullQuote(art.pullQuote || '');
    setEditCaption(art.imageCaption || '');
    setEditImageUrl(art.imageUrl || '');
    setEditLeadStory(!!art.leadStory);
    setEditFeatured(!!art.featured);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressUploadedImage(file, (result) => {
        setEditImageUrl(result);
      });
    }
  };

  const handleSaveEditedArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editTitle.trim() || !editContent.trim()) {
      showToast('Please fill in headline and story content.');
      return;
    }

    const paragraphs = editContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const matchedCat = categories.find((c) => c.name.toLowerCase() === editCategory.toLowerCase());
    const catTheme = matchedCat
      ? { accentColor: matchedCat.color, badgeBg: matchedCat.badgeBg, badgeText: matchedCat.badgeText }
      : editingArticle.categoryTheme;

    const finalAuthorName = editAuthor.trim() || editingArticle.author;
    const finalAuthorRole = editRole.trim() || editingArticle.authorRole;
    const finalAuthorBio =
      editAuthorBio.trim() ||
      editingArticle.authorBio ||
      `Student journalist at Barobo National High School writing for The Inkspirer.`;

    const matchedProfile = authorProfiles.find(
      (p) => p.name.trim().toLowerCase() === finalAuthorName.toLowerCase()
    );

    const updated: Article = {
      ...editingArticle,
      title: editTitle.trim(),
      deck: editDeck.trim() || editTitle.trim(),
      category: editCategory,
      author: finalAuthorName,
      authorRole: finalAuthorRole,
      authorBio: finalAuthorBio,
      authorGradeSection: editAuthorGrade.trim() || matchedProfile?.gradeSection || editingArticle.authorGradeSection,
      authorProfileId: matchedProfile?.id || editingArticle.authorProfileId,
      authorPhotoUrl: matchedProfile?.photoUrl || editingArticle.authorPhotoUrl,
      authorMotto: matchedProfile?.journalismMotto || editingArticle.authorMotto,
      authorAccolades: matchedProfile?.accolades || editingArticle.authorAccolades,
      content: paragraphs.length > 0 ? paragraphs : [editContent.trim()],
      pullQuote: editPullQuote.trim() || undefined,
      imageCaption: editCaption.trim() || undefined,
      imageUrl: normalizeImageUrl(editImageUrl) || undefined,
      leadStory: editLeadStory,
      featured: editFeatured,
      categoryTheme: catTheme,
    };

    onUpdateArticle(updated);

    // Sync bio changes to StudentAuthorProfile directory as well
    if (matchedProfile && onUpdateAuthorProfile) {
      onUpdateAuthorProfile(matchedProfile.id, {
        name: finalAuthorName,
        role: finalAuthorRole,
        gradeSection: editAuthorGrade.trim() || matchedProfile.gradeSection,
        bio: finalAuthorBio,
      });
    } else if (!matchedProfile && onAddAuthorProfile) {
      onAddAuthorProfile({
        name: finalAuthorName,
        role: finalAuthorRole,
        gradeSection: editAuthorGrade.trim() || 'BNHS Student Journalist',
        beat: `${editCategory} Desk`,
        bio: finalAuthorBio,
      });
    }

    setEditingArticle(null);
    showToast(`Updated "${updated.title}" & synced author bio profile!`);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPin = activeAdviserConfig.pinCode || '1991';
    if (
      pinCode === validPin ||
      pinCode === '1991' ||
      pinCode.toLowerCase() === 'bnhs' ||
      pinCode === 'admin' ||
      pinCode === '1234'
    ) {
      setIsPinUnlocked(true);
      loginAsAdviserDemo({
        name: activeAdviserConfig.name,
        email: activeAdviserConfig.email,
        designation: `${activeAdviserConfig.role} · ${activeAdviserConfig.designation}`,
        department: activeAdviserConfig.department,
        photoUrl: activeAdviserConfig.photoUrl || null,
      });
      setAuthError('');
      showToast(`Welcome, ${activeAdviserConfig.name} (${activeAdviserConfig.role})`);
    } else {
      setAuthError(`Incorrect PIN. (Tip: Try ${validPin} or click Quick Login below)`);
    }
  };

  const handleLoadSampleStory = () => {
    setComposerCategory('News');
    setComposerTitle('BNHS Campus Journalists Bag Top Honors at Surigao del Sur Division Press Conference');
    setComposerDeck('The Inkspirer scribes secure 14 individual and group awards across English and Filipino categories, advancing to the Caraga Regional Schools Press Conference.');
    setComposerAuthor('John Cedric Morales');
    setComposerRole('Editor-in-Chief');
    setComposerAuthorGrade('Grade 12 HUMSS - Rizal');
    setComposerAuthorBio('Senior HUMSS student, DSPC 1st Place News Writer, and Editor-in-Chief of The Inkspirer at Barobo National High School.');
    setComposerContent(
      'BAROBO, SURIGAO DEL SUR — Student journalists of Barobo National High School’s official publication, The Inkspirer, delivered a commanding performance at the Division Schools Press Conference (DSPC), bringing home 14 major awards in both individual writing and collaborative publishing contests.\n\nCompeting against secondary schools from across Surigao del Sur, the BNHS delegation clinched first place in News Writing, Editorial Kartooning, Feature Writing, and Collaborative Desktop Publishing.\n\n“Every late afternoon spent refining our leads and verifying facts in the publication room paid off,” shared Publication Adviser Mrs. Maria Elena Delos Reyes. “Our young writers proved that responsible campus journalism thrives in Barobo.”\n\nThe winning qualifiers will represent the Surigao del Sur Division at the upcoming Caraga Regional Schools Press Conference (RSPC) next month.'
    );
    setComposerPullQuote('“Our young writers proved that responsible, truth-centered campus journalism thrives here at Barobo National High School.”');
    setComposerCaption('The Inkspirer editorial delegation celebrates after the DSPC awarding ceremonies.');
    setComposerLeadStory(true);
    setComposerFeatured(true);
    setComposerError('');
    showToast('Loaded sample article into Story Composer — click Publish to post live!');
  };

  const handleApproveAndPublish = (sub: StorySubmission) => {
    const published = onPublishSubmission(sub.id);
    if (published) {
      setLastPublishedArticle(published);
      showToast(`Published “${sub.headline}” to The Inkspirer!`);
      setSelectedSubmission(null);
    }
  };

  const handleRequestRevision = (sub: StorySubmission) => {
    if (!feedbackNote.trim()) {
      showToast('Please write feedback for the student writer before requesting revisions.');
      return;
    }
    onUpdateSubmissionStatus(sub.id, 'revision_requested', feedbackNote);
    showToast(`Revision requested for “${sub.headline}”`);
    setSelectedSubmission(null);
    setFeedbackNote('');
  };

  const handlePublishNewArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTitle.trim() || !composerContent.trim()) {
      const msg = 'Please enter both an Article Headline and Story Narrative before publishing.';
      setComposerError(msg);
      showToast(msg);
      return;
    }
    setComposerError('');

    const paragraphs = composerContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const matchedCat = categories.find((c) => c.name.toLowerCase() === composerCategory.toLowerCase());
    const categoryTheme = matchedCat
      ? { accentColor: matchedCat.color, badgeBg: matchedCat.badgeBg, badgeText: matchedCat.badgeText }
      : { accentColor: '#FB923C', badgeBg: 'bg-orange-50', badgeText: 'text-orange-900' };

    const finalAuthorName = composerAuthor.trim() || 'The Inkspirer Editorial Staff';
    const finalAuthorRole = composerRole.trim() || 'Student Journalist';
    const finalAuthorBio =
      composerAuthorBio.trim() ||
      `Student journalist at Barobo National High School writing for The Inkspirer.`;

    const matchedProfile = authorProfiles.find(
      (p) => p.name.trim().toLowerCase() === finalAuthorName.toLowerCase()
    );

    const createdArt = onCreateArticle({
      title: composerTitle.trim(),
      deck: composerDeck.trim() || composerTitle.trim(),
      category: composerCategory,
      author: finalAuthorName,
      authorRole: finalAuthorRole,
      authorBio: finalAuthorBio,
      authorGradeSection: composerAuthorGrade.trim() || matchedProfile?.gradeSection,
      authorProfileId: matchedProfile?.id,
      authorPhotoUrl: matchedProfile?.photoUrl,
      authorMotto: matchedProfile?.journalismMotto,
      authorAccolades: matchedProfile?.accolades,
      imageUrl: normalizeImageUrl(composerImageUrl) || undefined,
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      readTime: `${Math.max(1, Math.ceil(composerContent.trim().split(/\s+/).length / 200))} min read`,
      featured: composerFeatured,
      leadStory: composerLeadStory,
      content: paragraphs.length > 0 ? paragraphs : [composerContent.trim()],
      pullQuote: composerPullQuote.trim() || undefined,
      imageCaption: composerCaption.trim() || undefined,
      categoryTheme,
      issue: currentVolumeIssue,
    });

    setLastPublishedArticle(createdArt);

    // Also ensure or sync the StudentAuthorProfile in the directory
    if (matchedProfile && onUpdateAuthorProfile) {
      onUpdateAuthorProfile(matchedProfile.id, {
        role: finalAuthorRole,
        gradeSection: composerAuthorGrade.trim() || matchedProfile.gradeSection,
        bio: finalAuthorBio,
      });
    } else if (!matchedProfile && onAddAuthorProfile) {
      onAddAuthorProfile({
        name: finalAuthorName,
        role: finalAuthorRole,
        gradeSection: composerAuthorGrade.trim() || 'BNHS Student Journalist',
        beat: `${composerCategory} Desk`,
        bio: finalAuthorBio,
      });
    }

    showToast(`Published “${createdArt.title}” to The Inkspirer live portal!`);
    // Reset composer
    setComposerTitle('');
    setComposerDeck('');
    setComposerContent('');
    setComposerPullQuote('');
    setComposerCaption('');
    setComposerImageUrl('');
    setComposerLeadStory(false);
    setComposerFeatured(false);
    setActiveTab('articles');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Please provide announcement title and content.');
      return;
    }

    const payload: Omit<Announcement, 'id'> = {
      title: annTitle.trim(),
      type: annType,
      ...(annDeadline.trim() ? { deadline: annDeadline.trim() } : {}),
      ...(annLocation.trim() ? { location: annLocation.trim() } : {}),
      urgent: annUrgent,
      isPinned: annUrgent,
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      content: annContent.trim(),
    };

    onAddAnnouncement(payload);

    showToast('Campus announcement dispatched to bulletin!');
    setAnnTitle('');
    setAnnDeadline('');
    setAnnLocation('');
    setAnnUrgent(false);
    setAnnContent('');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressUploadedImage(file, (dataUrl) => {
        setComposerImageUrl(dataUrl);
      });
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const deskMenuItems: {
    id: typeof activeTab;
    label: string;
    shortLabel: string;
    group: 'Editorial Workflow' | 'Publication & Roster' | 'Administration';
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    urgentBadge?: boolean;
    isAdviserSpecial?: boolean;
  }[] = [
    {
      id: 'submissions',
      label: 'Submissions Queue',
      shortLabel: 'Submissions',
      group: 'Editorial Workflow',
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : submissions.length,
      urgentBadge: pendingCount > 0,
    },
    {
      id: 'compose',
      label: 'Publish New Story',
      shortLabel: 'Publish Story',
      group: 'Editorial Workflow',
      icon: PlusCircle,
      badge: 'New',
    },
    {
      id: 'articles',
      label: 'Live Articles',
      shortLabel: 'Live Articles',
      group: 'Editorial Workflow',
      icon: Edit3,
      badge: articles.length,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      shortLabel: 'Announcements',
      group: 'Editorial Workflow',
      icon: Megaphone,
      badge: announcements.length,
    },
    {
      id: 'categories',
      label: 'Category Management',
      shortLabel: 'Categories',
      group: 'Publication & Roster',
      icon: Tags,
      badge: categories.length,
    },
    {
      id: 'staff',
      label: 'Editorial Board Staff',
      shortLabel: 'Board Staff',
      group: 'Publication & Roster',
      icon: Users,
      badge: staff.length,
    },
    {
      id: 'author-bios',
      label: 'Author Bio Profiles',
      shortLabel: 'Author Bios',
      group: 'Publication & Roster',
      icon: Feather,
      badge: authorProfiles.length,
    },
    {
      id: 'adviser',
      label: 'Portal Adviser & Resignation',
      shortLabel: 'Adviser Portal',
      group: 'Administration',
      icon: Shield,
      isAdviserSpecial: true,
    },
    {
      id: 'subscribers',
      label: 'Newsletter Subscribers',
      shortLabel: 'Subscribers',
      group: 'Administration',
      icon: Mail,
      badge: subscribersList.length + 342,
    },
  ];

  const menuGroups: ('Editorial Workflow' | 'Publication & Roster' | 'Administration')[] = [
    'Editorial Workflow',
    'Publication & Roster',
    'Administration',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex justify-center p-2 sm:p-3 md:p-5">
      <div className="bg-white text-[#1C1917] w-full max-w-7xl rounded-lg shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto max-h-[94vh]">
        {/* Header Strip with Integrated Session & Quick Controls (Maroon Theme + Official Inkspirer Logo) */}
        <div className="bg-[#4A0E17] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#34070E]">
          <div className="flex items-center gap-3">
            <InkspirerLogo size="sm" className="w-10 h-10" />
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-[#F3C562]">
                Barobo National High School · Publication Office
              </div>
              <h2 className="font-brand text-base sm:text-xl font-bold tracking-tight text-white">
                The Inkspirer Editorial & Category Desk
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {deskToast && (
              <span className="text-xs bg-emerald-700/90 text-white px-2.5 py-1 rounded font-medium">
                {deskToast}
              </span>
            )}

            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeskVolumeIssue(currentVolumeIssue);
                    setDeskAcademicYear(currentAcademicYear);
                    setDeskCirculation(currentCirculation);
                    setDeskIssn(currentIssn);
                    setDeskMotto(currentMotto);
                    setDeskTaglineDescription(currentTaglineDescription);
                    setDeskIssnAutoNotice(false);
                    setIsEditEditionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#34070E]/90 hover:bg-[#5C1521] border border-[#D4AF37]/50 text-[#F3C562] transition-colors cursor-pointer"
                  title="Edit Publication Volume, Issue No. & School Year (S.Y.)"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Edit Issue & S.Y.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeskVolumeIssue(currentVolumeIssue);
                    setDeskAcademicYear(currentAcademicYear);
                    setDeskCirculation(currentCirculation);
                    setDeskIssn(currentIssn);
                    setDeskMotto(currentMotto);
                    setDeskTaglineDescription(currentTaglineDescription);
                    setDeskIssnAutoNotice(false);
                    setIsEditEditionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#34070E]/90 hover:bg-[#5C1521] border border-[#D4AF37]/50 text-[#F3C562] transition-colors cursor-pointer"
                  title="Edit Announcements Circulation & Electronic ISSN"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Edit Circulation & ISSN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeskMotto(currentMotto);
                    setDeskTaglineDescription(currentTaglineDescription);
                    setIsEditMottoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#34070E]/90 hover:bg-[#5C1521] border border-[#D4AF37]/50 text-[#F3C562] transition-colors cursor-pointer"
                  title="Edit “Ideas in ink. Voices in motion.” & Masthead Subtitle Description"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Edit Motto & Tagline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#34070E]/80 hover:bg-[#5C1521] border border-[#681622] text-stone-200 transition-colors cursor-pointer"
                  title={isSidebarOpen ? 'Hide side menu panel' : 'Show side menu panel'}
                >
                  {isSidebarOpen ? (
                    <>
                      <PanelLeftClose className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Hide Sidebar</span>
                    </>
                  ) : (
                    <>
                      <PanelLeftOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Show Sidebar</span>
                    </>
                  )}
                </button>

                {userProfile && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#34070E]/90 border border-[#681622] rounded text-xs text-stone-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white truncate max-w-[140px]">
                      {userProfile.displayName}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#F3C562] px-1.5 py-0.2 bg-[#5C1521] border border-[#D4AF37]/40 rounded">
                      {userProfile.role === 'adviser' ? 'Adviser' : 'Editor'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsPinUnlocked(false);
                        showToast('Signed out of Editorial Desk');
                      }}
                      className="ml-1 text-[11px] text-amber-300 hover:text-white hover:underline font-medium cursor-pointer"
                      title="Sign Out or switch accounts"
                    >
                      Sign Out
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset all stories, submissions, and notices back to initial demo state?')) {
                      onResetDefaults();
                      showToast('Database reset to official default state');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded bg-[#34070E]/80 hover:bg-[#5C1521] border border-[#681622] text-stone-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset sample data"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden md:inline">Reset Demo</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate Screen (if locked) */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-5">
            <div className="flex items-center justify-center mx-auto">
              <InkspirerLogo size="lg" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Editorial Board Authorization
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Enter your Adviser PIN or Student Editor Access Code to manage publications, review submissions, and post announcements.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Enter PIN (e.g. 1991)"
                className="w-full text-center px-4 py-2 text-sm border border-stone-300 rounded font-mono tracking-widest focus:ring-1 focus:ring-[#4A0E17] focus:outline-none"
              />
              {authError && <div className="text-xs text-red-600 font-medium">{authError}</div>}
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#4A0E17] hover:bg-[#5C1521] rounded transition-colors cursor-pointer"
              >
                Verify & Enter Editorial Desk
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Instant Staff Sign-In (Official Credentials)
              </div>
              <button
                type="button"
                onClick={() => {
                  loginAsAdviserDemo({
                    name: activeAdviserConfig.name,
                    email: activeAdviserConfig.email,
                    designation: `${activeAdviserConfig.role} · ${activeAdviserConfig.designation}`,
                    department: activeAdviserConfig.department,
                    photoUrl: activeAdviserConfig.photoUrl || null,
                  });
                  setIsPinUnlocked(true);
                  showToast(`Signed in as ${activeAdviserConfig.name} (${activeAdviserConfig.role})`);
                }}
                className="w-full py-2 px-3 text-xs font-semibold rounded bg-[#4A0E17] hover:bg-[#5C1521] text-[#F3C562] border border-[#6B1420] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔑 Log in as {activeAdviserConfig.name} (Portal Adviser)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsEditorDemo();
                  setIsPinUnlocked(true);
                  showToast('Signed in as John Cedric Morales (Editor-in-Chief)');
                }}
                className="w-full py-2 px-3 text-xs font-semibold rounded bg-[#5C1521] hover:bg-[#6D1A28] text-white border border-[#6B1420] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✍️ Log in as John Cedric Morales (Editor-in-Chief)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    setIsPinUnlocked(true);
                    showToast('Signed in with Google Account');
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Google Sign-in was cancelled';
                    setAuthError(message);
                  }
                }}
                className="w-full py-2 px-3 text-xs font-semibold rounded bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🌐 Sign in with DepEd / Google Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Maroon Quick-Access Navigator Grid (All 9 sections visible at once without horizontal scrolling) */}
            <div className="bg-[#38080F] border-b border-[#58111A] px-4 sm:px-6 py-2.5 space-y-2 text-white">
              {/* Mobile Quick-Jump Selector + Session Bar (< 640px) */}
              <div className="flex sm:hidden items-center justify-between gap-2 pb-1 border-b border-[#58111A]">
                <div className="flex items-center gap-1.5 flex-1">
                  <LayoutGrid className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <select
                    aria-label="Quick Jump to Portal Menu"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-[#4A0E17] border border-[#681622] rounded text-[#F3C562] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    {deskMenuItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#4A0E17] text-white">
                        {item.label} {item.badge !== undefined ? `(${item.badge})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {userProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsPinUnlocked(false);
                      showToast('Signed out of Editorial Desk');
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 bg-[#4A0E17] border border-[#681622] rounded shrink-0"
                  >
                    Sign Out
                  </button>
                )}
              </div>

              {/* Full Wrapped 9-Item Maroon Navigator Grid */}
              <nav
                aria-label="Editorial Desk & Adviser Portal Navigation"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-1.5"
              >
                {deskMenuItems.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`px-2.5 py-2 text-xs rounded-md transition-all flex items-center justify-between gap-1.5 border text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#2A050B] font-bold border-[#F3C562] shadow-xs ring-1 ring-[#F3C562]/50'
                          : 'bg-[#4A0E17] text-stone-100 hover:text-[#F3C562] hover:bg-[#5C1521] border-[#681622] font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <IconComp
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#4A0E17]' : 'text-[#D4AF37]'
                          }`}
                        />
                        <span className="truncate">{item.shortLabel}</span>
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                            isActive
                              ? 'bg-[#4A0E17] text-[#F3C562]'
                              : item.urgentBadge
                                ? 'bg-[#D4AF37] text-[#2A050B]'
                                : 'bg-[#34070E] text-stone-200 border border-[#681622]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Workspace Container: Collapsible Maroon Left Sidebar Navigator + Scrollable Tab Body */}
            <div className="flex-1 flex overflow-hidden">
              {isSidebarOpen && (
                <aside
                  aria-label="Editorial Desk Side Menu"
                  className="hidden lg:flex w-60 shrink-0 flex-col bg-[#38080F] text-white border-r border-[#58111A] overflow-y-auto p-3.5 space-y-4"
                >
                  {menuGroups.map((groupName) => {
                    const groupItems = deskMenuItems.filter((i) => i.group === groupName);
                    return (
                      <div key={groupName} className="space-y-1">
                        <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-[#F3C562]/80">
                          {groupName}
                        </div>
                        {groupItems.map((item) => {
                          const IconComp = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full px-3 py-2 text-xs rounded-md transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
                                isActive
                                  ? 'bg-[#D4AF37] text-[#2A050B] font-bold border-[#F3C562] shadow-xs'
                                  : 'bg-[#4A0E17]/70 text-stone-100 hover:text-[#F3C562] hover:bg-[#5C1521] border-[#58111A] font-medium'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <IconComp
                                  className={`w-4 h-4 shrink-0 ${
                                    isActive ? 'text-[#4A0E17]' : 'text-[#D4AF37]'
                                  }`}
                                />
                                <span className="truncate">{item.label}</span>
                              </span>
                              {item.badge !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                                    isActive
                                      ? 'bg-[#4A0E17] text-[#F3C562]'
                                      : item.urgentBadge
                                        ? 'bg-[#D4AF37] text-[#2A050B]'
                                        : 'bg-[#2A050B] text-stone-200 border border-[#681622]'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Quick Active Adviser Card at bottom of maroon sidebar */}
                  <div className="mt-auto pt-3 border-t border-[#58111A]">
                    <div className="bg-[#4A0E17] border border-[#681622] rounded-md p-2.5 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#F3C562] flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#D4AF37]" />
                        <span>Active Portal Adviser</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {activeAdviserConfig.name}
                      </div>
                      <div className="text-[11px] text-stone-300 truncate">
                        {activeAdviserConfig.designation}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('adviser')}
                        className="w-full mt-1 py-1 px-2 text-[11px] font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors text-center cursor-pointer"
                      >
                        Manage Adviser Portal →
                      </button>
                    </div>
                  </div>
                </aside>
              )}

              {/* TAB BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: SUBMISSIONS QUEUE */}
              {activeTab === 'submissions' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Aspiring Student Writer Submissions
                      </h3>
                      <p className="text-xs text-stone-500">
                        Review incoming articles submitted by BNHS learners. Click any submission to inspect manuscript, provide feedback, or publish live to the newsletter.
                      </p>
                    </div>
                    <div className="text-xs text-stone-600 bg-stone-100 px-3 py-1 rounded">
                      {pendingCount} Pending Review
                    </div>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-xs">
                      No submissions in queue. Students can submit articles through the "Submit a Story" modal.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {submissions.map((sub) => {
                        const statusColors = {
                          pending: 'bg-amber-50 text-amber-800 border-amber-200',
                          approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          revision_requested: 'bg-blue-50 text-blue-800 border-blue-200',
                          rejected: 'bg-stone-100 text-stone-600 border-stone-300',
                        };

                        const statusLabels = {
                          pending: 'Pending Review',
                          approved: 'Approved & Published',
                          revision_requested: 'Revisions Requested',
                          rejected: 'Archived',
                        };

                        return (
                          <div
                            key={sub.id}
                            className={`border rounded-lg p-5 bg-white transition-all ${
                              selectedSubmission?.id === sub.id
                                ? 'border-[#0B2545] ring-1 ring-[#0B2545]'
                                : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                                  <span className="font-bold text-[#133E87] uppercase tracking-wide">
                                    {sub.category} Desk
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{sub.submittedAt}</span>
                                </div>
                                <h4 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                                  {sub.headline}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                                    statusColors[sub.status]
                                  }`}
                                >
                                  {statusLabels[sub.status]}
                                </span>
                              </div>
                            </div>

                            {/* Author & Summary */}
                            <div className="text-xs text-stone-600 mb-3 space-y-1 bg-stone-50 p-3 rounded border border-stone-100">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-stone-800">{sub.studentName}</span>
                                <span className="text-stone-400">({sub.gradeSection})</span>
                                <span aria-hidden="true">·</span>
                                <span className="text-stone-500">{sub.email}</span>
                              </div>
                              <p className="text-stone-700 italic">“{sub.summary}”</p>
                              {sub.notesToEditor && (
                                <div className="text-[11px] text-stone-500 pt-1">
                                  <strong>Student Note:</strong> {sub.notesToEditor}
                                </div>
                              )}
                              {sub.editorFeedback && (
                                <div className="text-[11px] text-[#133E87] font-medium pt-1 border-t border-stone-200">
                                  <strong>Editor Feedback:</strong> {sub.editorFeedback}
                                </div>
                              )}
                            </div>

                            {/* Action Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedSubmission(sub)}
                                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Inspect Manuscript</span>
                                </button>

                                <button
                                  onClick={() => downloadSubmissionTextFile(sub)}
                                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors flex items-center gap-1"
                                  title="Download manuscript text file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download .txt</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                {sub.status !== 'approved' && (
                                  <button
                                    onClick={() => handleApproveAndPublish(sub)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Publish Live</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Submission Detail Modal / Drawer */}
                  {selectedSubmission && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-stone-200 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#133E87] mb-1">
                              {selectedSubmission.category} Manuscript Inspection
                            </div>
                            <h3 className="font-serif text-xl font-bold text-stone-900">
                              {selectedSubmission.headline}
                            </h3>
                            <div className="text-xs text-stone-500 mt-1">
                              By {selectedSubmission.studentName} ({selectedSubmission.gradeSection}) · {selectedSubmission.email}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedSubmission(null)}
                            className="p-1 rounded text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="bg-[#FBF9F5] p-4 rounded border border-stone-200 text-xs space-y-2 mb-4">
                          <div>
                            <strong className="text-stone-700">Catchy Summary / Deck:</strong>
                            <p className="text-stone-600 mt-0.5">{selectedSubmission.summary}</p>
                          </div>
                          {selectedSubmission.notesToEditor && (
                            <div className="pt-2 border-t border-stone-200">
                              <strong className="text-stone-700">Author Notes to Editors:</strong>
                              <p className="text-stone-600 mt-0.5">{selectedSubmission.notesToEditor}</p>
                            </div>
                          )}
                        </div>

                        <div className="mb-6">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                            Complete Article Manuscript:
                          </label>
                          <div className="p-4 bg-stone-50 rounded border border-stone-200 text-xs text-stone-800 font-sans leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                            {selectedSubmission.content}
                          </div>
                        </div>

                        {/* Editor Feedback Input */}
                        <div className="mb-6">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Adviser / Editor Feedback or Revision Notes:
                          </label>
                          <textarea
                            rows={2}
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            placeholder="Provide constructive feedback for student development (e.g. 'Strong lead! Please clarify paragraph 3...')"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
                          <button
                            onClick={() => downloadSubmissionTextFile(selectedSubmission)}
                            className="px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Manuscript (.txt)</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRequestRevision(selectedSubmission)}
                              className="px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                            >
                              Request Revision
                            </button>

                            <button
                              onClick={() => handleApproveAndPublish(selectedSubmission)}
                              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Publish to Portal</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMPOSE NEW STORY */}
              {activeTab === 'compose' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">
                        Publish a New Story
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Compose campus articles, assign student bylines, attach photos, and publish directly to The Inkspirer without touching code.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleStory}
                      className="px-3 py-1.5 text-xs font-bold text-[#0B2545] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37] rounded transition-colors shrink-0 cursor-pointer"
                    >
                      Load Sample Story
                    </button>
                  </div>

                  {composerError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{composerError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePublishNewArticle} className="space-y-5">
                    {/* Category & Status Flags */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Publication Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={composerCategory}
                          onChange={(e) => setComposerCategory(e.target.value as Category)}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white font-medium focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={composerLeadStory}
                            onChange={(e) => setComposerLeadStory(e.target.checked)}
                            className="rounded border-stone-300 text-[#0B2545] focus:ring-[#0B2545]"
                          />
                          <span>Set as Front-Page Lead Story</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={composerFeatured}
                            onChange={(e) => setComposerFeatured(e.target.checked)}
                            className="rounded border-stone-300 text-[#0B2545] focus:ring-[#0B2545]"
                          />
                          <span>Mark as Special Feature</span>
                        </label>
                      </div>
                    </div>

                    {/* Headline */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Article Headline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={composerTitle}
                        onChange={(e) => {
                          setComposerTitle(e.target.value);
                          if (composerError) setComposerError('');
                        }}
                        placeholder="e.g. BNHS Environmental Club Launches Native Mangrove Seedling Nursery"
                        className="w-full px-3 py-2 text-sm font-serif border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none font-bold text-stone-900"
                      />
                    </div>

                    {/* Deck / Subtitle */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Deck / Summary (Sub-headline)
                      </label>
                      <input
                        type="text"
                        value={composerDeck}
                        onChange={(e) => setComposerDeck(e.target.value)}
                        placeholder="A concise, engaging secondary deck that summarizes the core development..."
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                      />
                    </div>

                    {/* Author Byline & Student Journalist Bio Profile Sub-Section */}
                    <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-4 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5">
                          <Feather className="w-3.5 h-3.5 text-[#4A0E17]" />
                          <span>Student Journalist Byline & Author Bio Profile</span>
                        </div>
                        {authorProfiles.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-stone-500">Load Registered Journalist:</span>
                            <select
                              value=""
                              onChange={(e) => {
                                const selected = authorProfiles.find((p) => p.id === e.target.value);
                                if (selected) {
                                  setComposerAuthor(selected.name);
                                  setComposerRole(selected.role);
                                  setComposerAuthorGrade(selected.gradeSection);
                                  setComposerAuthorBio(selected.bio);
                                }
                              }}
                              className="px-2.5 py-1 text-xs border border-stone-300 rounded bg-white text-stone-800 font-medium focus:outline-none"
                            >
                              <option value="">Select Student Scribe...</option>
                              {authorProfiles.map((prof) => (
                                <option key={prof.id} value={prof.id}>
                                  {prof.name} ({prof.role})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setActiveTab('author-bios')}
                              className="text-[11px] font-semibold text-[#133E87] hover:underline"
                            >
                              Manage Bios
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Writer / Journalist Name
                          </label>
                          <input
                            type="text"
                            value={composerAuthor}
                            onChange={(e) => setComposerAuthor(e.target.value)}
                            placeholder="e.g. John Cedric Morales"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Editorial Role / Title
                          </label>
                          <input
                            type="text"
                            value={composerRole}
                            onChange={(e) => setComposerRole(e.target.value)}
                            placeholder="e.g. Editor-in-Chief"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Grade Level & Section
                          </label>
                          <input
                            type="text"
                            value={composerAuthorGrade}
                            onChange={(e) => setComposerAuthorGrade(e.target.value)}
                            placeholder="e.g. Grade 12 HUMSS - Rizal"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Student Journalist Author Bio (Displayed in Article View)
                        </label>
                        <textarea
                          rows={2}
                          value={composerAuthorBio}
                          onChange={(e) => setComposerAuthorBio(e.target.value)}
                          placeholder="Short biography of the student journalist (e.g., Grade 12 HUMSS student, RSPC qualifier, and campus reporter...)"
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Story Content */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Story Narrative (Separate paragraphs with double enter) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={8}
                        value={composerContent}
                        onChange={(e) => {
                          setComposerContent(e.target.value);
                          if (composerError) setComposerError('');
                        }}
                        placeholder="BAROBO, SURIGAO DEL SUR — Write the complete journalistic article here..."
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-sans leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                      />
                    </div>

                    {/* Pull Quote & Photo Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Editorial Pull Quote (Optional)
                        </label>
                        <input
                          type="text"
                          value={composerPullQuote}
                          onChange={(e) => setComposerPullQuote(e.target.value)}
                          placeholder="“A poignant excerpt or key quote from the article...”"
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none italic"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Photo Caption (Optional)
                        </label>
                        <input
                          type="text"
                          value={composerCaption}
                          onChange={(e) => setComposerCaption(e.target.value)}
                          placeholder="e.g. Student researchers analyzing water specimens in Lab 2."
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Image Attachment (File upload or URL) */}
                    <div className="border border-stone-200 bg-[#FBF9F5] p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                          <span>Attach Photo or Artwork</span>
                        </label>
                        <span className="text-[11px] text-stone-500">
                          (Supports file upload, direct image URL, or Google Drive link)
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#4A0E17] file:text-white hover:file:bg-[#5C1521] cursor-pointer"
                        />
                        <span className="text-xs text-stone-400">or</span>
                        <input
                          type="text"
                          value={composerImageUrl}
                          onChange={(e) => setComposerImageUrl(normalizeImageUrl(e.target.value))}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text');
                            if (pasted) {
                              e.preventDefault();
                              setComposerImageUrl(normalizeImageUrl(pasted));
                            }
                          }}
                          placeholder="Paste image URL or Google Drive share link..."
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#4A0E17] focus:outline-none"
                        />
                      </div>

                      {composerImageUrl && (
                        <div className="mt-2 flex items-center gap-3 bg-white p-2 rounded border border-stone-200">
                          <img
                            src={normalizeImageUrl(composerImageUrl)}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            onError={handleImageErrorWithDriveFallback}
                            className="w-16 h-12 object-cover rounded border border-stone-200 shrink-0"
                          />
                          <div className="text-xs text-stone-600 flex-1 truncate">
                            Image attached & preview ready
                          </div>
                          <button
                            type="button"
                            onClick={() => setComposerImageUrl('')}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Publish Action Button */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                      <button
                        type="submit"
                        className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Publish Article to Live Portal</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: MANAGE PUBLISHED ARTICLES & CATEGORIES */}
              {activeTab === 'articles' && (
                <div className="space-y-4">
                  {lastPublishedArticle && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold">Story Published Live on The Inkspirer!</div>
                          <div className="text-emerald-800">
                            “{lastPublishedArticle.title}” is now live under <strong>{lastPublishedArticle.category}</strong>.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {onViewArticle && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewArticle(lastPublishedArticle);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                          >
                            Read Live Story
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setLastPublishedArticle(null)}
                          className="p-1 text-emerald-700 hover:text-emerald-950"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Manage Published Articles & Categories
                      </h3>
                      <p className="text-xs text-stone-500">
                        Create, edit, update, delete stories, change publication categories, and upload/replace story photos.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('compose')}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create New Story</span>
                    </button>
                  </div>

                  {/* Maroon Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#38080F] p-2.5 rounded-lg border border-[#58111A] text-white">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setArticleCategoryFilter('All')}
                        className={`px-3 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          articleCategoryFilter === 'All'
                            ? 'bg-[#D4AF37] text-[#2A050B] font-bold'
                            : 'text-stone-200 hover:bg-[#5C1521]'
                        }`}
                      >
                        <span>All</span>
                        <span className="ml-1 text-[10px] opacity-80">({articles.length})</span>
                      </button>
                      {categories.map((cat) => {
                        const count = articles.filter(
                          (a) => a.category.toLowerCase() === cat.name.toLowerCase()
                        ).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setArticleCategoryFilter(cat.name)}
                            className={`px-3 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              articleCategoryFilter.toLowerCase() === cat.name.toLowerCase()
                                ? 'bg-[#D4AF37] text-[#2A050B] font-bold'
                                : 'text-stone-200 hover:bg-[#5C1521]'
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                            <span className="text-[10px] opacity-80">({count})</span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={articleSearchQuery}
                      onChange={(e) => setArticleSearchQuery(e.target.value)}
                      placeholder="Search title or author..."
                      className="px-3 py-1 text-xs border border-[#681622] rounded bg-[#4A0E17] text-white placeholder:text-stone-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-56"
                    />
                  </div>

                  {/* Articles List */}
                  <div className="space-y-3">
                    {articles
                      .filter((art) => {
                        if (articleCategoryFilter !== 'All' && art.category !== articleCategoryFilter) return false;
                        if (articleSearchQuery.trim()) {
                          const q = articleSearchQuery.toLowerCase();
                          return art.title.toLowerCase().includes(q) || art.author.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((art) => (
                        <div
                          key={art.id}
                          className="bg-white border border-stone-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-stone-400 transition-colors shadow-2xs"
                        >
                          <div className="flex items-start gap-3 max-w-xl">
                            {/* Photo Thumbnail */}
                            <div className="w-16 h-14 sm:w-20 sm:h-16 rounded overflow-hidden bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center">
                              {art.imageUrl ? (
                                <img
                                  src={normalizeImageUrl(art.imageUrl)}
                                  alt={art.title}
                                  referrerPolicy="no-referrer"
                                  onError={handleImageErrorWithDriveFallback}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 text-center px-1">
                                  {art.category}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                                <span className="font-bold text-[#133E87] uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                                  {art.category} Desk
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{art.date}</span>
                                {art.leadStory && (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                                    ★ Front-Page Lead
                                  </span>
                                )}
                                {art.featured && (
                                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <h4 className="font-serif text-base font-bold text-stone-900 leading-snug line-clamp-1">
                                {art.title}
                              </h4>
                              <div className="text-xs text-stone-500">
                                By {art.author} ({art.authorRole}) · {art.views} views · {art.likes} likes
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditArticle(art)}
                              className="px-3 py-1.5 text-xs rounded border border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                              title="Edit headline, content, category, and photo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Story & Photo</span>
                            </button>

                            {/* Lead Story Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateArticle({
                                  ...art,
                                  leadStory: !art.leadStory,
                                });
                                showToast(
                                  art.leadStory
                                    ? 'Unset from lead story'
                                    : 'Promoted to Front-Page Lead Story!'
                                );
                              }}
                              className={`px-2.5 py-1.5 text-xs rounded border transition-colors ${
                                art.leadStory
                                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                              title={art.leadStory ? 'Demote from front-page lead' : 'Promote to front-page lead'}
                            >
                              {art.leadStory ? 'Lead ★' : 'Make Lead'}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete story "${art.title}" from portal?`)) {
                                  onDeleteArticle(art.id);
                                  showToast('Story deleted from portal');
                                }
                              }}
                              className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                              title="Delete article permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* EDIT ARTICLE MODAL */}
                  {editingArticle && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 mb-4 border-b border-stone-200 pb-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#133E87] mb-0.5">
                              Edit Publication Story & Photo
                            </div>
                            <h3 className="font-serif text-xl font-bold text-stone-900">
                              Edit: {editingArticle.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingArticle(null)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveEditedArticle} className="space-y-4">
                          {/* Category and Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Category <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as Category)}
                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white font-medium focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                                <input
                                  type="checkbox"
                                  checked={editLeadStory}
                                  onChange={(e) => setEditLeadStory(e.target.checked)}
                                  className="rounded border-stone-300 text-[#0B2545] focus:ring-[#0B2545]"
                                />
                                <span>Set as Lead Story</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                                <input
                                  type="checkbox"
                                  checked={editFeatured}
                                  onChange={(e) => setEditFeatured(e.target.checked)}
                                  className="rounded border-stone-300 text-[#0B2545] focus:ring-[#0B2545]"
                                />
                                <span>Mark as Featured</span>
                              </label>
                            </div>
                          </div>

                          {/* Headline */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Headline / Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm font-serif font-bold text-stone-900 border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                            />
                          </div>

                          {/* Deck */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Deck / Sub-headline
                            </label>
                            <input
                              type="text"
                              value={editDeck}
                              onChange={(e) => setEditDeck(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                            />
                          </div>

                          {/* Author & Student Journalist Bio Profile Section */}
                          <div className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5">
                                <Feather className="w-3.5 h-3.5 text-[#4A0E17]" />
                                <span>Student Journalist Byline & Bio Profile</span>
                              </span>
                              {authorProfiles.length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const selected = authorProfiles.find((p) => p.id === e.target.value);
                                    if (selected) {
                                      setEditAuthor(selected.name);
                                      setEditRole(selected.role);
                                      setEditAuthorGrade(selected.gradeSection);
                                      setEditAuthorBio(selected.bio);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-xs border border-stone-300 rounded bg-white text-stone-800 font-medium"
                                >
                                  <option value="">Switch / Load Student Journalist Bio...</option>
                                  {authorProfiles.map((prof) => (
                                    <option key={prof.id} value={prof.id}>
                                      {prof.name} ({prof.role})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Author Name
                                </label>
                                <input
                                  type="text"
                                  value={editAuthor}
                                  onChange={(e) => setEditAuthor(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Author Role
                                </label>
                                <input
                                  type="text"
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Grade & Section
                                </label>
                                <input
                                  type="text"
                                  value={editAuthorGrade}
                                  onChange={(e) => setEditAuthorGrade(e.target.value)}
                                  placeholder="e.g. Grade 12 HUMSS"
                                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Student Journalist Author Bio (Synced to Article View)
                              </label>
                              <textarea
                                rows={2}
                                value={editAuthorBio}
                                onChange={(e) => setEditAuthorBio(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Story Narrative */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Story Narrative (Paragraphs separated by double enter) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              required
                              rows={6}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-sans leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                            />
                          </div>

                          {/* Pull Quote & Caption */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Pull Quote
                              </label>
                              <input
                                type="text"
                                value={editPullQuote}
                                onChange={(e) => setEditPullQuote(e.target.value)}
                                placeholder="“Memorable excerpt...”"
                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded italic focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Photo Caption
                              </label>
                              <input
                                type="text"
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                placeholder="Description of the photo..."
                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* PHOTO UPLOAD & MANAGEMENT */}
                          <div className="border border-stone-200 bg-[#FBF9F5] p-3.5 rounded-lg space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                              <span>Upload or Replace Story Photo</span>
                            </label>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditImageUpload}
                                className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#4A0E17] file:text-white hover:file:bg-[#5C1521] cursor-pointer"
                              />
                              <span className="text-xs text-stone-400">or</span>
                              <input
                                type="text"
                                value={editImageUrl}
                                onChange={(e) => setEditImageUrl(normalizeImageUrl(e.target.value))}
                                onPaste={(e) => {
                                  const pasted = e.clipboardData.getData('text');
                                  if (pasted) {
                                    e.preventDefault();
                                    setEditImageUrl(normalizeImageUrl(pasted));
                                  }
                                }}
                                placeholder="Paste image URL or Google Drive share link..."
                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#4A0E17] focus:outline-none"
                              />
                            </div>

                            {editImageUrl && (
                              <div className="mt-2 flex items-center gap-3 bg-white p-2 rounded border border-stone-200">
                                <img
                                  src={normalizeImageUrl(editImageUrl)}
                                  alt="Photo Preview"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageErrorWithDriveFallback}
                                  className="w-16 h-12 object-cover rounded border border-stone-200 shrink-0"
                                />
                                <div className="text-xs text-stone-600 flex-1 truncate">
                                  Photo attached & preview ready
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditImageUrl('')}
                                  className="text-xs text-red-600 hover:underline cursor-pointer"
                                >
                                  Remove Photo
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                            <button
                              type="button"
                              onClick={() => setEditingArticle(null)}
                              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Save & Update Story</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* TAB 4: CAMPUS ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Manage Campus Announcements & Circulars
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Post examination schedules, press conferences, and school notices to the top announcement ticker and gazette.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeskVolumeIssue(currentVolumeIssue);
                          setDeskAcademicYear(currentAcademicYear);
                          setDeskCirculation(currentCirculation);
                          setDeskIssn(currentIssn);
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setDeskIssnAutoNotice(false);
                          setIsEditEditionModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#F3C562] rounded-md transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#4A0E17]" />
                        <span>Edit Issue & S.Y.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeskVolumeIssue(currentVolumeIssue);
                          setDeskAcademicYear(currentAcademicYear);
                          setDeskCirculation(currentCirculation);
                          setDeskIssn(currentIssn);
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setDeskIssnAutoNotice(false);
                          setIsEditEditionModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-[#F3C562] bg-[#4A0E17] hover:bg-[#5C1521] border border-[#681622] rounded-md transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Edit Circulation & ISSN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setIsEditMottoModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-[#F3C562] bg-[#4A0E17] hover:bg-[#5C1521] border border-[#681622] rounded-md transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Edit Motto & Tagline</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Announcement Form */}
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="bg-[#FBF9F5] border border-stone-200 rounded-lg p-5 space-y-4"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-[#133E87]" />
                      <span>Post a New Campus Notice</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Notice Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={annTitle}
                          onChange={(e) => setAnnTitle(e.target.value)}
                          placeholder="e.g. Schedule of 2nd Quarter Periodic Examinations"
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Bulletin Category
                        </label>
                        <select
                          value={annType}
                          onChange={(e) => setAnnType(e.target.value as Announcement['type'])}
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Effective Date or Deadline
                        </label>
                        <input
                          type="text"
                          value={annDeadline}
                          onChange={(e) => setAnnDeadline(e.target.value)}
                          placeholder="e.g. November 6–7, 2026"
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Venue or Location
                        </label>
                        <input
                          type="text"
                          value={annLocation}
                          onChange={(e) => setAnnLocation(e.target.value)}
                          placeholder="e.g. BNHS Gymnasium / Audio-Visual Room"
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={annUrgent}
                            onChange={(e) => setAnnUrgent(e.target.checked)}
                            className="rounded border-stone-300 text-red-600 focus:ring-red-500"
                          />
                          <span>Pin to Top as Urgent Notice</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Notice Details & Instructions <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Provide details, permits required, and instructions for learners and parents..."
                        className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Post Announcement</span>
                      </button>
                    </div>
                  </form>

                  {/* List of Announcements */}
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className={`bg-white border rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                          editingAnnouncement?.id === ann.id
                            ? 'border-[#0B2545] ring-2 ring-[#0B2545]/15 bg-blue-50/20'
                            : 'border-stone-200'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-[#991B1B] uppercase tracking-wide">
                              {ann.type} Notice
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-stone-500">{ann.date}</span>
                            {ann.isPinned && (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                                Pinned
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-stone-900 text-base">
                            {ann.title}
                          </h4>
                          <p className="text-xs text-stone-600 line-clamp-2 max-w-2xl">
                            {ann.content}
                          </p>
                          {(ann.deadline || ann.location) && (
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-500">
                              {ann.deadline && (
                                <span className="inline-flex items-center gap-1 font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                                  <span>📅 Effective / Deadline:</span>
                                  <span>{ann.deadline}</span>
                                </span>
                              )}
                              {ann.location && (
                                <span className="inline-flex items-center gap-1 font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                                  <span>📍 Venue:</span>
                                  <span>{ann.location}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAnnouncement(ann)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded border border-[#0B2545] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title={`Edit ${ann.type} Notice`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Notice</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onTogglePinAnnouncement(ann.id);
                              showToast(ann.isPinned ? 'Unpinned notice' : 'Pinned notice to top');
                            }}
                            className={`px-2.5 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                              ann.isPinned
                                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            {ann.isPinned ? 'Pinned ★' : 'Pin to Top'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteAnnouncement(ann.id);
                              if (editingAnnouncement?.id === ann.id) {
                                setEditingAnnouncement(null);
                              }
                              showToast('Announcement removed');
                            }}
                            className="p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* EDIT ACADEMIC / CAMPUS NOTICE MODAL */}
                  {editingAnnouncement && (
                    <div className="fixed inset-0 z-[70] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
                        <div className="bg-[#0B2545] text-white px-5 py-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                            <h4 className="font-serif font-bold text-base">
                              Edit {editAnnType} Notice
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingAnnouncement(null)}
                            className="p-1 rounded text-stone-300 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveEditAnnouncement} className="p-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                                Notice Title *
                              </label>
                              <input
                                type="text"
                                required
                                value={editAnnTitle}
                                onChange={(e) => setEditAnnTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                                Bulletin Category
                              </label>
                              <select
                                value={editAnnType}
                                onChange={(e) =>
                                  setEditAnnType(e.target.value as Announcement['type'])
                                }
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:outline-none font-medium"
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
                              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                                Effective Date or Deadline
                              </label>
                              <input
                                type="text"
                                value={editAnnDeadline}
                                onChange={(e) => setEditAnnDeadline(e.target.value)}
                                placeholder="e.g. November 6–7, 2026"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                                Venue or Location
                              </label>
                              <input
                                type="text"
                                value={editAnnLocation}
                                onChange={(e) => setEditAnnLocation(e.target.value)}
                                placeholder="e.g. All BNHS Classrooms"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                              <input
                                type="checkbox"
                                checked={editAnnUrgent}
                                onChange={(e) => setEditAnnUrgent(e.target.checked)}
                                className="rounded border-stone-300 text-red-600 focus:ring-red-500"
                              />
                              <span>Pin to Top as Urgent / Priority Notice</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                              Notice Details & Instructions *
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={editAnnContent}
                              onChange={(e) => setEditAnnContent(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                            <button
                              type="button"
                              onClick={() => setEditingAnnouncement(null)}
                              className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Save Notice Changes</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PUBLICATION CATEGORIES & BEATS MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  {/* Category Management Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-0.5">
                        Publication Beats & Menus Architecture
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">
                        Category & Beat Management
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                        Add, edit, rename, or delete publication categories. Upload display cover photos, customize color badges, and assign icons. All updates cascade across the masthead, reader, filters, and story archives.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeskVolumeIssue(currentVolumeIssue);
                          setDeskAcademicYear(currentAcademicYear);
                          setDeskCirculation(currentCirculation);
                          setDeskIssn(currentIssn);
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setDeskIssnAutoNotice(false);
                          setIsEditEditionModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#F3C562] rounded-md transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#4A0E17]" />
                        <span>Edit Issue & S.Y.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeskVolumeIssue(currentVolumeIssue);
                          setDeskAcademicYear(currentAcademicYear);
                          setDeskCirculation(currentCirculation);
                          setDeskIssn(currentIssn);
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setDeskIssnAutoNotice(false);
                          setIsEditEditionModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-bold text-[#F3C562] bg-[#4A0E17] hover:bg-[#5C1521] border border-[#D4AF37]/50 rounded-md transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                        <span>Edit Circulation & ISSN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeskMotto(currentMotto);
                          setDeskTaglineDescription(currentTaglineDescription);
                          setIsEditMottoModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-bold text-[#F3C562] bg-[#4A0E17] hover:bg-[#5C1521] border border-[#D4AF37]/50 rounded-md transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                        <span>Edit Motto & Tagline</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAddCategory}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#5C1521] rounded-md transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                        <span>Add New Category</span>
                      </button>
                    </div>
                  </div>

                  {/* Official Publication Volume, Issue, Academic Year, Circulation, ISSN, Motto & Tagline Quick-Edit Card */}
                  <form
                    onSubmit={handleSaveEditionFromDesk}
                    className="bg-[#4A0E17] text-white border border-[#681622] rounded-lg p-4 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3C562]">
                          Official Masthead Dateline, Motto, Tagline, Circulation & ISSN Configuration
                        </div>
                        <h4 className="font-serif text-base font-bold text-white">
                          Issue & S.Y., Motto (“Ideas in ink...”), Tagline, Circulation & Auto-ISSN
                        </h4>
                        <p className="text-xs text-stone-300">
                          {currentVolumeIssue} · {currentAcademicYear} · {currentCirculation} · {currentIssn}
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#F3C562] rounded transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A0E17]" />
                        <span>Save Masthead Settings</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#F3C562] mb-1">
                          Volume & Issue No. (Auto-ISSN)
                        </label>
                        <input
                          type="text"
                          required
                          value={deskVolumeIssue}
                          onChange={(e) => handleDeskVolumeIssueChange(e.target.value)}
                          placeholder="Vol. XXIV · Issue No. 1"
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#F3C562] mb-1">
                          School Year / Academic Year (S.Y.)
                        </label>
                        <input
                          type="text"
                          required
                          value={deskAcademicYear}
                          onChange={(e) => setDeskAcademicYear(e.target.value)}
                          placeholder="Academic Year 2026–2027"
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#F3C562] mb-1">
                          Circulation Statement
                        </label>
                        <input
                          type="text"
                          required
                          value={deskCirculation}
                          onChange={(e) => setDeskCirculation(e.target.value)}
                          placeholder="Circulation: 2,800+ Students & Faculty"
                          className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-[#F3C562]">
                            Electronic ISSN
                          </label>
                          <button
                            type="button"
                            onClick={() => setDeskIssn(generateRandomElectronicIssn())}
                            className="text-[10px] font-bold text-[#D4AF37] hover:underline cursor-pointer"
                          >
                            Generate New
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={deskIssn}
                          onChange={(e) => setDeskIssn(e.target.value)}
                          placeholder="ISSN 2984-7125 (Electronic)"
                          className="w-full px-3 py-1.5 text-xs font-mono font-semibold rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1 border-t border-[#681622]/60">
                      <div className="lg:col-span-4">
                        <label className="block text-[11px] font-semibold text-[#F3C562] mb-1">
                          Publication Motto (“Ideas in ink. Voices in motion.”)
                        </label>
                        <input
                          type="text"
                          required
                          value={deskMotto}
                          onChange={(e) => setDeskMotto(e.target.value)}
                          placeholder="“Ideas in ink. Voices in motion.”"
                          className="w-full px-3 py-1.5 text-xs font-serif italic font-semibold rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div className="lg:col-span-8">
                        <label className="block text-[11px] font-semibold text-[#F3C562] mb-1">
                          Masthead Subtitle & Tagline Description
                        </label>
                        <input
                          type="text"
                          required
                          value={deskTaglineDescription}
                          onChange={(e) => setDeskTaglineDescription(e.target.value)}
                          placeholder="Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place."
                          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-[#34070E] border border-[#681622] text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </form>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                      <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                        Active Categories
                      </div>
                      <div className="text-xl font-bold text-stone-900 mt-0.5">
                        {categories.length}
                      </div>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                      <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                        Categorized Stories
                      </div>
                      <div className="text-xl font-bold text-[#0B2545] mt-0.5">
                        {articles.length}
                      </div>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                      <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                        Pending In Review
                      </div>
                      <div className="text-xl font-bold text-amber-700 mt-0.5">
                        {pendingCount}
                      </div>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                      <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                        Photo Banners
                      </div>
                      <div className="text-xl font-bold text-emerald-700 mt-0.5">
                        {categories.filter((c) => !!c.imageUrl).length} / {categories.length}
                      </div>
                    </div>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categories.map((cat) => {
                      const storyCount = articles.filter(
                        (a) => a.category.toLowerCase() === cat.name.toLowerCase()
                      ).length;
                      const subCount = submissions.filter(
                        (s) => s.category.toLowerCase() === cat.name.toLowerCase()
                      ).length;

                      return (
                        <div
                          key={cat.id}
                          className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                        >
                          {/* Category Cover Photo / Image Banner */}
                          <div className="relative h-36 bg-stone-900 overflow-hidden">
                            {cat.imageUrl ? (
                              <img
                                src={normalizeImageUrl(cat.imageUrl)}
                                alt={cat.name}
                                referrerPolicy="no-referrer"
                                onError={handleImageErrorWithDriveFallback}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div
                                className="w-full h-full opacity-90 flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${cat.color} 0%, #1c1917 100%)`,
                                }}
                              >
                                <CategoryIcon
                                  name={cat.iconName}
                                  className="w-12 h-12 text-white/40"
                                />
                              </div>
                            )}

                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                              <span
                                className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                                style={{ backgroundColor: cat.color }}
                              >
                                <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                                <span>{cat.name}</span>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {cat.isDefault && (
                                  <span className="text-[10px] font-semibold bg-white/90 text-stone-800 px-2 py-0.5 rounded shadow-xs">
                                    Default Beat
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs px-2 py-0.5 rounded">
                                  {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Title in Banner */}
                            <div className="absolute bottom-2.5 left-3 right-3 text-white">
                              <div className="font-serif font-bold text-lg leading-tight drop-shadow-sm flex items-center gap-2">
                                <span>{cat.name} Desk</span>
                              </div>
                              <div className="text-[10px] text-stone-300 font-mono">
                                #{cat.slug}
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <p className="text-xs text-stone-600 line-clamp-2 min-h-[32px] leading-relaxed">
                              {cat.description || 'No description provided.'}
                            </p>

                            {/* Badge Preview Strip */}
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                              <span className="text-stone-400 text-[11px]">Theme Preview:</span>
                              <span
                                className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${cat.badgeBg} ${cat.badgeText}`}
                              >
                                {cat.name}
                              </span>
                            </div>

                            {/* Story Stats Meta */}
                            <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded">
                              <span>
                                <strong>{storyCount}</strong> live articles
                              </span>
                              <span>
                                <strong>{subCount}</strong> submissions
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCategory(cat)}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded border border-[#0B2545] text-[#0B2545] hover:bg-[#0B2545] hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit & Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteCategory(cat)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-200"
                                title={`Delete ${cat.name} category`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ADD CATEGORY MODAL */}
                  {isAddCategoryOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 mb-4 border-b border-stone-200 pb-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-0.5">
                              Create Publication Beat
                            </div>
                            <h3 className="font-serif text-xl font-bold text-stone-900">
                              Add New Category
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddCategoryOpen(false)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                          {/* Name & Icon */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Category Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="e.g. Science & Technology, Arts & Culture"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Category Icon
                              </label>
                              <select
                                value={newCatIcon}
                                onChange={(e) => setNewCatIcon(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white font-medium focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              >
                                {ICON_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Description / Editorial Scope
                            </label>
                            <textarea
                              rows={2}
                              value={newCatDesc}
                              onChange={(e) => setNewCatDesc(e.target.value)}
                              placeholder="Describe what kind of campus articles and stories fall under this beat..."
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none resize-none"
                            />
                          </div>

                          {/* Color Palette Selection */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-2">
                              Color Theme & Accent
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setNewCatColor(preset.color);
                                    setNewCatBadgeBg(preset.badgeBg);
                                    setNewCatBadgeText(preset.badgeText);
                                  }}
                                  className={`p-2 rounded border text-left text-[11px] transition-all flex items-center gap-2 ${
                                    newCatColor === preset.color
                                      ? 'border-[#0B2545] ring-1 ring-[#0B2545] bg-stone-50 font-bold'
                                      : 'border-stone-200 hover:border-stone-400'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: preset.color }}
                                  />
                                  <span className="truncate">{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cover Photo / Image Upload Section */}
                          <div className="border border-stone-200 bg-stone-50 p-4 rounded-lg space-y-3">
                            <label className="block text-xs font-bold text-stone-800">
                              Upload or Replace Story Photo / Category Cover Image
                            </label>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              {/* File Upload Button */}
                              <label className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-100 rounded text-xs font-medium cursor-pointer text-stone-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                                <span>Upload Photo File</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleCategoryPhotoUpload(e, false)}
                                />
                              </label>

                              <span className="text-xs text-stone-400 text-center sm:text-left">or paste image URL:</span>

                              <input
                                type="text"
                                value={newCatImageUrl}
                                onChange={(e) => setNewCatImageUrl(normalizeImageUrl(e.target.value))}
                                onPaste={(e) => {
                                  const pasted = e.clipboardData.getData('text');
                                  if (pasted) {
                                    e.preventDefault();
                                    setNewCatImageUrl(normalizeImageUrl(pasted));
                                  }
                                }}
                                placeholder="Paste image URL or Google Drive share link..."
                                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#4A0E17]"
                              />
                            </div>

                            {/* Preset Photo Suggestions */}
                            <div>
                              <div className="text-[11px] text-stone-500 mb-1.5">
                                Or choose a curated preset image:
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {PRESET_PHOTOS.map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setNewCatImageUrl(preset.url)}
                                    className={`relative h-14 rounded overflow-hidden border text-left group transition-all ${
                                      newCatImageUrl === preset.url
                                        ? 'border-[#0B2545] ring-2 ring-[#0B2545]'
                                        : 'border-stone-200 opacity-80 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={preset.url}
                                      alt={preset.label}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] text-white font-medium leading-tight">
                                      {preset.label}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Image Preview */}
                            {newCatImageUrl && (
                              <div className="relative h-28 rounded-lg overflow-hidden border border-stone-200 mt-2">
                                <img
                                  src={normalizeImageUrl(newCatImageUrl)}
                                  alt="Cover Preview"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageErrorWithDriveFallback}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <button
                                    type="button"
                                    onClick={() => setNewCatImageUrl('')}
                                    className="p-1 rounded bg-black/70 text-white hover:bg-black transition-colors text-xs"
                                    title="Remove photo"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-white">
                                  Live Banner Preview
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit Actions */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                            <button
                              type="button"
                              onClick={() => setIsAddCategoryOpen(false)}
                              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#5C1521] rounded transition-colors shadow-xs"
                            >
                              Create Category
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* EDIT CATEGORY MODAL */}
                  {editingCategory && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 mb-4 border-b border-stone-200 pb-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-0.5">
                              Edit Publication Beat
                            </div>
                            <h3 className="font-serif text-xl font-bold text-stone-900">
                              Edit Category: {editingCategory.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-1 rounded text-stone-400 hover:text-stone-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveEditCategory} className="space-y-4">
                          {/* Name & Icon */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Category Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={editCatName}
                                onChange={(e) => setEditCatName(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Category Icon
                              </label>
                              <select
                                value={editCatIcon}
                                onChange={(e) => setEditCatIcon(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white font-medium focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              >
                                {ICON_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Description / Scope
                            </label>
                            <textarea
                              rows={2}
                              value={editCatDesc}
                              onChange={(e) => setEditCatDesc(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none resize-none"
                            />
                          </div>

                          {/* Color Palette */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-2">
                              Color Accent & Theme
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setEditCatColor(preset.color);
                                    setEditCatBadgeBg(preset.badgeBg);
                                    setEditCatBadgeText(preset.badgeText);
                                  }}
                                  className={`p-2 rounded border text-left text-[11px] transition-all flex items-center gap-2 ${
                                    editCatColor === preset.color
                                      ? 'border-[#0B2545] ring-1 ring-[#0B2545] bg-stone-50 font-bold'
                                      : 'border-stone-200 hover:border-stone-400'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                    style={{ backgroundColor: preset.color }}
                                  />
                                  <span className="truncate">{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cover Photo / Image Upload Section */}
                          <div className="border border-stone-200 bg-stone-50 p-4 rounded-lg space-y-3">
                            <label className="block text-xs font-bold text-stone-800">
                              Upload or Replace Story Photo / Category Cover Banner
                            </label>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              {/* File Upload Button */}
                              <label className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-100 rounded text-xs font-medium cursor-pointer text-stone-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                                <span>Upload New Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleCategoryPhotoUpload(e, true)}
                                />
                              </label>

                              <span className="text-xs text-stone-400 text-center sm:text-left">or paste image URL:</span>

                              <input
                                type="text"
                                value={editCatImageUrl}
                                onChange={(e) => setEditCatImageUrl(normalizeImageUrl(e.target.value))}
                                onPaste={(e) => {
                                  const pasted = e.clipboardData.getData('text');
                                  if (pasted) {
                                    e.preventDefault();
                                    setEditCatImageUrl(normalizeImageUrl(pasted));
                                  }
                                }}
                                placeholder="Paste image URL or Google Drive share link..."
                                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#4A0E17]"
                              />
                            </div>

                            {/* Preset Options */}
                            <div>
                              <div className="text-[11px] text-stone-500 mb-1.5">
                                Select from preset campus imagery:
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {PRESET_PHOTOS.map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setEditCatImageUrl(preset.url)}
                                    className={`relative h-14 rounded overflow-hidden border text-left group transition-all ${
                                      editCatImageUrl === preset.url
                                        ? 'border-[#0B2545] ring-2 ring-[#0B2545]'
                                        : 'border-stone-200 opacity-80 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={preset.url}
                                      alt={preset.label}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] text-white font-medium leading-tight">
                                      {preset.label}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Image Preview */}
                            {editCatImageUrl && (
                              <div className="relative h-28 rounded-lg overflow-hidden border border-stone-200 mt-2">
                                <img
                                  src={normalizeImageUrl(editCatImageUrl)}
                                  alt="Cover Preview"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageErrorWithDriveFallback}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditCatImageUrl('')}
                                    className="p-1 rounded bg-black/70 text-white hover:bg-black transition-colors text-xs"
                                    title="Remove photo"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-white">
                                  Live Banner Preview
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit Actions */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors shadow-xs"
                            >
                              Save Category Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* DELETE CATEGORY CONFIRMATION MODAL */}
                  {deletingCategory && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-stone-200">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                          <AlertTriangle className="w-6 h-6 shrink-0" />
                          <h3 className="font-serif text-lg font-bold text-stone-900">
                            Delete Category: {deletingCategory.name}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-600 leading-relaxed mb-4">
                          Are you sure you want to delete the{' '}
                          <strong className="text-stone-900">{deletingCategory.name}</strong> category?
                          Articles and submissions currently filed under this category will not be lost, but will be safely reassigned.
                        </p>

                        <div className="bg-stone-50 border border-stone-200 rounded p-3 mb-4 space-y-2 text-xs">
                          <label className="block font-semibold text-stone-800">
                            Reassign existing stories to:
                          </label>
                          <select
                            value={deleteFallbackCategory}
                            onChange={(e) => setDeleteFallbackCategory(e.target.value)}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white font-medium focus:ring-1 focus:ring-[#0B2545]"
                          >
                            {categories
                              .filter((c) => c.id !== deletingCategory.id)
                              .map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(null)}
                            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmDeleteCategory}
                            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-xs"
                          >
                            Confirm Delete & Reassign
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: EDITORIAL STAFF */}
              {activeTab === 'staff' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        The Inkspirer Editorial Board & Masthead Roster
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Official publication advisers and student editorial staff of Barobo National High School (A.Y. 2026–2027). Add new staff members, appoint a Portal Adviser, or process an Adviser resignation and handover.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded font-medium">
                        {staff.length} Roster Members
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenAddPortalAdviser}
                        className="px-3.5 py-2 text-xs font-bold text-[#F3C562] bg-[#4A0E17] hover:bg-[#34070E] border border-[#D4AF37]/50 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>+ Add Portal Adviser</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAddStaff}
                        className="px-4 py-2 text-xs font-bold text-stone-900 bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Editorial Member</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Portal Adviser Quick Status & Resignation Banner */}
                  <div className="bg-linear-to-r from-[#34070E] via-[#4A0E17] to-[#0B2545] text-white rounded-lg p-4 border border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center text-[#F3C562] font-bold text-sm shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#D4AF37] text-[#0B2545]">
                            Active Portal Adviser
                          </span>
                          <span className="text-xs text-amber-200/90 font-mono">
                            {activeAdviserConfig.email}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-base text-white mt-0.5">
                          {activeAdviserConfig.name}
                        </h4>
                        <p className="text-xs text-stone-200">
                          {activeAdviserConfig.role} · {activeAdviserConfig.designation} ({activeAdviserConfig.department})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenAddPortalAdviser}
                        className="px-3 py-1.5 text-xs font-bold text-[#0B2545] bg-[#F3C562] hover:bg-[#D4AF37] rounded transition-colors"
                      >
                        Appoint New Adviser
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenResignModal}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 border border-red-400/40 rounded transition-colors"
                      >
                        Resign & Hand Over Advisership
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.map((member) => {
                      const isAdviserRole =
                        member.role.toLowerCase().includes('adviser') ||
                        member.role.toLowerCase().includes('consultant');
                      const isEmeritus =
                        member.role.toLowerCase().includes('former') ||
                        member.role.toLowerCase().includes('emeritus') ||
                        member.adviserStatus === 'emeritus';
                      const isCurrentPrimaryAdviser =
                        member.id === activeAdviserConfig.id ||
                        (member.name.toLowerCase() === activeAdviserConfig.name.toLowerCase() &&
                          !isEmeritus);

                      return (
                        <div
                          key={member.id}
                          className={`bg-white border rounded-lg p-4 flex items-start justify-between gap-3 shadow-2xs transition-all group ${
                            isCurrentPrimaryAdviser
                              ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 bg-amber-50/20'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            {member.photoUrl ? (
                              <img
                                src={normalizeImageUrl(member.photoUrl)}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                                onError={handleImageErrorWithDriveFallback}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-sm tracking-wide shrink-0 border-2 ${
                                  isEmeritus
                                    ? 'bg-stone-600 border-stone-400'
                                    : isAdviserRole
                                    ? 'bg-[#4A0E17] border-[#D4AF37]'
                                    : 'bg-[#0B2545] border-[#133E87]'
                                }`}
                              >
                                {member.name
                                  .split(' ')
                                  .filter(Boolean)
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-stone-900 text-sm truncate">
                                  {member.name}
                                </h4>
                                {isCurrentPrimaryAdviser && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4A0E17] text-[#F3C562] border border-[#D4AF37]">
                                    Active Portal Adviser
                                  </span>
                                )}
                                {isAdviserRole && !isCurrentPrimaryAdviser && !isEmeritus && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20">
                                    Co-Adviser
                                  </span>
                                )}
                                {isEmeritus && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                                    Former Adviser (Resigned)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-[#133E87] mt-0.5">
                                {member.role}
                              </div>
                              <div className="text-xs text-stone-600 mt-0.5">
                                {member.gradeOrDesignation}
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {member.department}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                            {isCurrentPrimaryAdviser ? (
                              <button
                                type="button"
                                onClick={handleOpenResignModal}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-red-800 bg-red-50 hover:bg-red-700 hover:text-white border border-red-200 rounded transition-colors"
                                title="Resign as Portal Adviser and hand over to a successor"
                              >
                                Resign
                              </button>
                            ) : (
                              isAdviserRole && (
                                <button
                                  type="button"
                                  onClick={() => handleSetMemberAsActiveAdviser(member)}
                                  className="px-2.5 py-1.5 text-[11px] font-semibold text-[#4A0E17] bg-amber-50 hover:bg-[#4A0E17] hover:text-white border border-amber-300 rounded transition-colors"
                                  title={`Make ${member.name} the Active Portal Adviser`}
                                >
                                  Set Active Adviser
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaff(member)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-[#0B2545] hover:text-white rounded transition-colors flex items-center gap-1"
                              title={`Edit ${member.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingStaff(member)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={`Remove ${member.name} from roster`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-stone-200 bg-[#FBF9F5] p-4 rounded text-xs text-stone-600">
                    <strong className="text-stone-800">School Publication Adviser Note:</strong>{' '}
                    The Inkspirer is the official high school paper of Barobo National High School, fostering free, ethical, and courageous campus journalism in Surigao del Sur under the guidance of the English and Filipino Departments.
                  </div>
                </div>
              )}

              {/* TAB: STUDENT JOURNALIST AUTHOR BIO PROFILES */}
              {activeTab === 'author-bios' && onAddAuthorProfile && onUpdateAuthorProfile && onDeleteAuthorProfile && (
                <AuthorBioManager
                  authorProfiles={authorProfiles}
                  articles={articles}
                  onAddAuthorProfile={onAddAuthorProfile}
                  onUpdateAuthorProfile={onUpdateAuthorProfile}
                  onDeleteAuthorProfile={onDeleteAuthorProfile}
                  onAssignAuthorToComposer={(prof) => {
                    setComposerAuthor(prof.name);
                    setComposerRole(prof.role);
                    setComposerAuthorGrade(prof.gradeSection);
                    setComposerAuthorBio(prof.bio);
                    setActiveTab('compose');
                    showToast(`Loaded ${prof.name}'s bio into Story Composer!`);
                  }}
                  onShowToast={showToast}
                />
              )}

              {/* TAB: PORTAL ADVISER MANAGEMENT, RESIGNATION & SUCCESSION */}
              {activeTab === 'adviser' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#991B1B] mb-0.5">
                        Publication Governance & Continuity (RA 7079)
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">
                        Portal Adviser Management & Resignation Handover
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                        Manage the official School Publication Adviser of The Inkspirer. Add a new Portal Adviser or Co-Adviser, update Adviser credentials, or process an official Adviser resignation and seamless portal handover to a successor.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenAddPortalAdviser}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                        <span>Add Portal Adviser</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenResignModal}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-200" />
                        <span>Resign as Adviser & Hand Over</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Portal Adviser Official Card */}
                  <div className="bg-white border-2 border-[#D4AF37] rounded-xl overflow-hidden shadow-md">
                    <div className="bg-linear-to-r from-[#34070E] via-[#4A0E17] to-[#0B2545] px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#F3C562]">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#D4AF37] text-[#0B2545]">
                            Current Incumbent Portal Adviser
                          </span>
                          <h4 className="font-serif text-lg font-bold text-white mt-0.5">
                            {activeAdviserConfig.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-amber-200 font-mono">
                          Appointed: {activeAdviserConfig.appointedDate}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const matchingMember = staff.find(
                              (m) =>
                                m.id === activeAdviserConfig.id ||
                                m.name.toLowerCase() === activeAdviserConfig.name.toLowerCase()
                            ) || {
                              id: activeAdviserConfig.id,
                              name: activeAdviserConfig.name,
                              role: activeAdviserConfig.role,
                              gradeOrDesignation: activeAdviserConfig.designation,
                              department: activeAdviserConfig.department,
                              avatarSeed: activeAdviserConfig.name,
                              email: activeAdviserConfig.email,
                              photoUrl: activeAdviserConfig.photoUrl,
                            };
                            handleOpenEditStaff(matchingMember);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-[#0B2545] bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-stone-50 p-3 rounded border border-stone-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Official Role Title
                          </div>
                          <div className="font-bold text-stone-900 text-sm mt-0.5">
                            {activeAdviserConfig.role}
                          </div>
                        </div>

                        <div className="bg-stone-50 p-3 rounded border border-stone-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Faculty Rank / Designation
                          </div>
                          <div className="font-bold text-stone-900 text-sm mt-0.5">
                            {activeAdviserConfig.designation}
                          </div>
                        </div>

                        <div className="bg-stone-50 p-3 rounded border border-stone-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Department & Office
                          </div>
                          <div className="font-semibold text-stone-800 mt-0.5">
                            {activeAdviserConfig.department}
                          </div>
                        </div>

                        <div className="bg-stone-50 p-3 rounded border border-stone-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Official DepEd / Portal Email & PIN
                          </div>
                          <div className="font-mono text-stone-800 mt-0.5">
                            {activeAdviserConfig.email} · PIN: <strong className="text-[#4A0E17]">{activeAdviserConfig.pinCode}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 space-y-3">
                        <div className="text-xs font-bold text-[#4A0E17]">
                          Need to Step Down or Resign as Adviser?
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          If the current Publication Adviser is resigning, transferring, or being reassigned, click below to appoint the incoming Portal Adviser and transfer full administrative custody.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenResignModal}
                          className="w-full py-2 px-3 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded transition-colors shadow-xs"
                        >
                          Process Adviser Resignation & Handover
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* All Advisers & Former Advisers on Roster */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-base text-stone-900">
                      Registered Portal Advisers & Faculty Consultants
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {staff
                        .filter(
                          (m) =>
                            m.role.toLowerCase().includes('adviser') ||
                            m.role.toLowerCase().includes('consultant') ||
                            m.id === activeAdviserConfig.id
                        )
                        .map((adv) => {
                          const isCurrent =
                            adv.id === activeAdviserConfig.id ||
                            (adv.name.toLowerCase() === activeAdviserConfig.name.toLowerCase() &&
                              !adv.role.toLowerCase().includes('former'));
                          const isEmeritus =
                            adv.role.toLowerCase().includes('former') ||
                            adv.role.toLowerCase().includes('emeritus') ||
                            adv.adviserStatus === 'emeritus';
                          return (
                            <div
                              key={adv.id}
                              className={`p-4 rounded-lg border flex items-center justify-between gap-3 ${
                                isCurrent
                                  ? 'bg-amber-50/40 border-[#D4AF37]'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900">
                                    {adv.name}
                                  </span>
                                  {isCurrent ? (
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                                      Active Primary
                                    </span>
                                  ) : isEmeritus ? (
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                                      Resigned / Emeritus
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-800">
                                      Co-Adviser
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#0B2545] font-semibold mt-0.5">
                                  {adv.role}
                                </div>
                                <div className="text-xs text-stone-500">{adv.gradeOrDesignation}</div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMemberAsActiveAdviser(adv)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors cursor-pointer"
                                  >
                                    Make Active Adviser
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStaff(adv)}
                                  className="px-3 py-1.5 text-xs font-bold text-[#0B2545] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 border border-[#D4AF37] rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#4A0E17]" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Official Handover & Resignation History Log */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-serif font-bold text-base text-stone-900">
                      Official Adviser Succession & Resignation Log
                    </h4>
                    {handoverHistory.length === 0 ? (
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center text-xs text-stone-500">
                        No adviser resignations or handovers recorded yet. Currently under the advisership of{' '}
                        <strong className="text-stone-800">{activeAdviserConfig.name}</strong>.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {handoverHistory.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white border border-stone-200 rounded-lg p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                  Resigned: {item.previousAdviserName}
                                </span>
                                <span className="text-stone-400">→</span>
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Appointed Successor: {item.newAdviserName} ({item.newAdviserDesignation})
                                </span>
                              </div>
                              <p className="text-stone-600 italic">“{item.reasonOrNote}”</p>
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono shrink-0">
                              {item.handoverDate}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SHARED MODAL 1: ADD EDITORIAL BOARD MEMBER */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
                    <div className="bg-[#4A0E17] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#34070E]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="font-serif font-bold text-base">
                          Add Member to Editorial Board & Masthead Roster
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddStaffOpen(false)}
                        className="p-1 rounded text-stone-300 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateStaffMember} className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g., Princess Mae S. Urbiztondo"
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Editorial Role / Position *
                        </label>
                        <input
                          type="text"
                          required
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value)}
                          placeholder="e.g., Managing Editor, News Editor, Photojournalist"
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            'Publication Adviser',
                            'Editor-in-Chief',
                            'Associate Editor',
                            'Managing Editor',
                            'News Editor',
                            'Features Editor',
                            'Opinion Editor',
                            'Sports Editor',
                            'Chief Photojournalist',
                            'Staff Writer',
                          ].map((rolePreset) => (
                            <button
                              key={rolePreset}
                              type="button"
                              onClick={() => setNewStaffRole(rolePreset)}
                              className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                                newStaffRole === rolePreset
                                  ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {rolePreset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Grade Level / Designation *
                          </label>
                          <input
                            type="text"
                            required
                            value={newStaffGrade}
                            onChange={(e) => setNewStaffGrade(e.target.value)}
                            placeholder="e.g., Grade 12 HUMSS or Master Teacher II"
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Department / Desk Assignment *
                          </label>
                          <input
                            type="text"
                            required
                            value={newStaffDept}
                            onChange={(e) => setNewStaffDept(e.target.value)}
                            placeholder="e.g., News & Public Affairs Desk"
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Profile Photo (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          {newStaffPhoto ? (
                            <img
                              src={normalizeImageUrl(newStaffPhoto)}
                              alt="Preview"
                              referrerPolicy="no-referrer"
                              onError={handleImageErrorWithDriveFallback}
                              className="w-11 h-11 rounded-full object-cover border border-[#D4AF37] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#4A0E17] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(newStaffName || 'IN')
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded cursor-pointer transition-colors inline-flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                                <span>Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleStaffPhotoUpload(e, false)}
                                  className="hidden"
                                />
                              </label>
                              {newStaffPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setNewStaffPhoto('')}
                                  className="text-xs text-red-600 hover:underline cursor-pointer"
                                >
                                  Clear Photo
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={newStaffPhoto}
                              onChange={(e) => setNewStaffPhoto(normalizeImageUrl(e.target.value))}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text');
                                if (pasted) {
                                  e.preventDefault();
                                  setNewStaffPhoto(normalizeImageUrl(pasted));
                                }
                              }}
                              placeholder="Paste image URL or Google Drive share link..."
                              className="w-full px-2.5 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#4A0E17]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setIsAddStaffOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-stone-900 bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors shadow-xs"
                        >
                          Add to Masthead Roster
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SHARED MODAL 2: EDIT EDITORIAL BOARD MEMBER OR PORTAL ADVISER */}
              {editingStaff && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
                    <div className="bg-[#4A0E17] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#34070E]">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                        <h4 className="font-serif font-bold text-base">
                          {editingStaff.role.toLowerCase().includes('adviser') ||
                          editingStaff.role.toLowerCase().includes('consultant') ||
                          editingStaff.id === activeAdviserConfig.id
                            ? 'Edit Portal Adviser / Faculty Consultant'
                            : 'Edit Editorial Board Member'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingStaff(null)}
                        className="p-1 rounded text-stone-300 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditStaffMember} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editStaffName}
                          onChange={(e) => setEditStaffName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Editorial Role / Position *
                        </label>
                        <input
                          type="text"
                          required
                          value={editStaffRole}
                          onChange={(e) => setEditStaffRole(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            'School Publication Adviser',
                            'Publication Adviser',
                            'Co-Adviser & Editorial Consultant',
                            'Editor-in-Chief',
                            'Associate Editor',
                            'Managing Editor',
                            'News Editor',
                            'Features Editor',
                            'Opinion Editor',
                            'Sports Editor',
                            'Chief Photojournalist',
                            'Staff Writer',
                          ].map((rolePreset) => (
                            <button
                              key={rolePreset}
                              type="button"
                              onClick={() => setEditStaffRole(rolePreset)}
                              className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                                editStaffRole === rolePreset
                                  ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {rolePreset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Grade Level / Faculty Rank *
                          </label>
                          <input
                            type="text"
                            required
                            value={editStaffGrade}
                            onChange={(e) => setEditStaffGrade(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Department / Desk Assignment *
                          </label>
                          <input
                            type="text"
                            required
                            value={editStaffDept}
                            onChange={(e) => setEditStaffDept(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      {(editingStaff.role.toLowerCase().includes('adviser') ||
                        editingStaff.role.toLowerCase().includes('consultant') ||
                        editingStaff.id === activeAdviserConfig.id ||
                        editingStaff.name.toLowerCase() === activeAdviserConfig.name.toLowerCase()) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded border border-amber-200">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                              Official DepEd / Portal Email
                            </label>
                            <input
                              type="email"
                              value={editStaffEmail}
                              onChange={(e) => setEditStaffEmail(e.target.value)}
                              placeholder="adviser@bnhs.deped.edu.ph"
                              className="w-full px-3 py-2 text-xs border border-stone-300 bg-white rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                            />
                          </div>
                          {(editingStaff.id === activeAdviserConfig.id ||
                            editingStaff.name.toLowerCase() === activeAdviserConfig.name.toLowerCase()) && (
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                                Portal Adviser Access PIN
                              </label>
                              <input
                                type="text"
                                value={editStaffPin}
                                onChange={(e) => setEditStaffPin(e.target.value)}
                                placeholder="e.g., 1991"
                                className="w-full px-3 py-2 text-xs font-mono border border-stone-300 bg-white rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Profile Photo (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          {editStaffPhoto ? (
                            <img
                              src={normalizeImageUrl(editStaffPhoto)}
                              alt="Preview"
                              referrerPolicy="no-referrer"
                              onError={handleImageErrorWithDriveFallback}
                              className="w-11 h-11 rounded-full object-cover border border-[#D4AF37] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#4A0E17] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(editStaffName || 'IN')
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded cursor-pointer transition-colors inline-flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5 text-[#4A0E17]" />
                                <span>Change Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleStaffPhotoUpload(e, true)}
                                  className="hidden"
                                />
                              </label>
                              {editStaffPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setEditStaffPhoto('')}
                                  className="text-xs text-red-600 hover:underline cursor-pointer"
                                >
                                  Remove Photo
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editStaffPhoto}
                              onChange={(e) => setEditStaffPhoto(normalizeImageUrl(e.target.value))}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text');
                                if (pasted) {
                                  e.preventDefault();
                                  setEditStaffPhoto(normalizeImageUrl(pasted));
                                }
                              }}
                              placeholder="Paste image URL or Google Drive share link..."
                              className="w-full px-2.5 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#4A0E17]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setEditingStaff(null)}
                          className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-[#4A0E17] hover:bg-[#5C1521] rounded transition-colors shadow-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SHARED MODAL 3: DELETE STAFF CONFIRMATION */}
              {deletingStaff && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <h4 className="font-serif font-bold text-lg text-stone-900">
                        Remove Member from Masthead Roster?
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Are you sure you want to remove{' '}
                      <strong className="text-stone-900">{deletingStaff.name}</strong> (
                      {deletingStaff.role}) from The Inkspirer Editorial Board & Masthead Roster?
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingStaff(null)}
                        className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteStaff}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Confirm Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SHARED MODAL A: ADD NEW PORTAL ADVISER / CO-ADVISER */}
              {isAddAdviserModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
                    <div className="bg-[#4A0E17] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#D4AF37]/40">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#F3C562]" />
                        <h4 className="font-serif font-bold text-base">
                          Add Portal Adviser / Faculty Consultant
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddAdviserModalOpen(false)}
                        className="p-1 rounded text-stone-300 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreatePortalAdviser} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Adviser Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAdviserName}
                            onChange={(e) => setNewAdviserName(e.target.value)}
                            placeholder="e.g., Mr. Roberto L. Villanueva"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Official DepEd Email
                          </label>
                          <input
                            type="email"
                            value={newAdviserEmail}
                            onChange={(e) => setNewAdviserEmail(e.target.value)}
                            placeholder="e.g., r.villanueva@bnhs.deped.edu.ph"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Adviser Position Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAdviserRole}
                            onChange={(e) => setNewAdviserRole(e.target.value)}
                            placeholder="School Publication Adviser"
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Faculty Rank / Designation *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAdviserDesignation}
                            onChange={(e) => setNewAdviserDesignation(e.target.value)}
                            placeholder="e.g., Master Teacher I - English Dept."
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Department / Office *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAdviserDepartment}
                            onChange={(e) => setNewAdviserDepartment(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                            Portal Adviser Access PIN
                          </label>
                          <input
                            type="text"
                            value={newAdviserPin}
                            onChange={(e) => setNewAdviserPin(e.target.value)}
                            placeholder="1991"
                            className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                          Profile Photo (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          {newAdviserPhoto ? (
                            <img
                              src={normalizeImageUrl(newAdviserPhoto)}
                              alt="Adviser Preview"
                              referrerPolicy="no-referrer"
                              onError={handleImageErrorWithDriveFallback}
                              className="w-11 h-11 rounded-full object-cover border border-[#D4AF37] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#4A0E17] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(newAdviserName || 'PA')
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              value={newAdviserPhoto}
                              onChange={(e) => setNewAdviserPhoto(normalizeImageUrl(e.target.value))}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text');
                                if (pasted) {
                                  e.preventDefault();
                                  setNewAdviserPhoto(normalizeImageUrl(pasted));
                                }
                              }}
                              placeholder="Paste image URL or Google Drive share link..."
                              className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#4A0E17]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-200 rounded p-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#34070E]">
                          <input
                            type="checkbox"
                            checked={makePrimaryAdviser}
                            onChange={(e) => setMakePrimaryAdviser(e.target.checked)}
                            className="rounded border-stone-300 text-[#4A0E17] focus:ring-[#4A0E17]"
                          />
                          <span>Set immediately as the Active Primary Portal Adviser</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setIsAddAdviserModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-[#0B2545] bg-[#D4AF37] hover:bg-[#E5BE4A] rounded transition-colors shadow-xs"
                        >
                          Save & Appoint Portal Adviser
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SHARED MODAL B: ADVISER RESIGNATION & PORTAL HANDOVER MODAL */}
              {isResignModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-auto">
                    <div className="bg-linear-to-r from-red-900 via-[#4A0E17] to-[#0B2545] text-white px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-[#F3C562]" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3C562]">
                            Official Advisership Turnover Protocol
                          </div>
                          <h4 className="font-serif font-bold text-base">
                            Resign as Portal Adviser & Appoint Successor
                          </h4>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsResignModalOpen(false)}
                        className="p-1 rounded text-stone-300 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmResignAndHandover} className="p-5 space-y-4 text-xs">
                      {/* Step 1: Outgoing Adviser Status */}
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-2">
                        <div className="font-bold text-stone-900">
                          1. Outgoing Portal Adviser: <span className="text-[#4A0E17]">{activeAdviserConfig.name}</span>
                        </div>
                        <p className="text-[11px] text-stone-600">
                          How should {activeAdviserConfig.name}'s record appear on The Inkspirer Masthead Roster after stepping down?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <label
                            className={`p-2.5 rounded border cursor-pointer flex items-start gap-2 transition-colors ${
                              resignDisposition === 'emeritus'
                                ? 'bg-amber-50 border-[#4A0E17] font-semibold text-stone-900'
                                : 'bg-white border-stone-200 text-stone-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resignDisposition"
                              checked={resignDisposition === 'emeritus'}
                              onChange={() => setResignDisposition('emeritus')}
                              className="mt-0.5"
                            />
                            <span>
                              Keep on Roster as <strong>Former Publication Adviser (Emeritus)</strong>
                            </span>
                          </label>
                          <label
                            className={`p-2.5 rounded border cursor-pointer flex items-start gap-2 transition-colors ${
                              resignDisposition === 'removed'
                                ? 'bg-red-50 border-red-600 font-semibold text-stone-900'
                                : 'bg-white border-stone-200 text-stone-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resignDisposition"
                              checked={resignDisposition === 'removed'}
                              onChange={() => setResignDisposition('removed')}
                              className="mt-0.5"
                            />
                            <span>
                              Remove completely from the active Masthead Roster
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Step 2: Incoming Portal Adviser Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">
                            2. Designate Incoming Successor Portal Adviser *
                          </span>
                          <div className="inline-flex rounded border border-stone-300 overflow-hidden text-[11px]">
                            <button
                              type="button"
                              onClick={() => setSuccessorMode('new')}
                              className={`px-2.5 py-1 font-semibold ${
                                successorMode === 'new'
                                  ? 'bg-[#0B2545] text-white'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              New Faculty Adviser
                            </button>
                            <button
                              type="button"
                              onClick={() => setSuccessorMode('existing')}
                              className={`px-2.5 py-1 font-semibold ${
                                successorMode === 'existing'
                                  ? 'bg-[#0B2545] text-white'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              From Existing Roster
                            </button>
                          </div>
                        </div>

                        {successorMode === 'existing' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-stone-700 mb-1">
                                Select Roster Member to Promote as Portal Adviser
                              </label>
                              <select
                                value={selectedExistingSuccessorId}
                                onChange={(e) => setSelectedExistingSuccessorId(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-300 rounded bg-white font-medium"
                              >
                                {staff
                                  .filter((m) => m.id !== activeAdviserConfig.id)
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.role} — {m.gradeOrDesignation})
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                New Adviser Title
                              </label>
                              <input
                                type="text"
                                value={successorRole}
                                onChange={(e) => setSuccessorRole(e.target.value)}
                                className="w-full px-3 py-1.5 border border-stone-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                New Adviser Access PIN
                              </label>
                              <input
                                type="text"
                                value={successorPin}
                                onChange={(e) => setSuccessorPin(e.target.value)}
                                className="w-full px-3 py-1.5 border border-stone-300 rounded font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Successor Adviser Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={successorName}
                                onChange={(e) => setSuccessorName(e.target.value)}
                                placeholder="e.g., Mr. Roberto L. Villanueva"
                                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Official Email Address
                              </label>
                              <input
                                type="email"
                                value={successorEmail}
                                onChange={(e) => setSuccessorEmail(e.target.value)}
                                placeholder="e.g., r.villanueva@bnhs.deped.edu.ph"
                                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Faculty Rank / Designation *
                              </label>
                              <input
                                type="text"
                                required
                                value={successorDesignation}
                                onChange={(e) => setSuccessorDesignation(e.target.value)}
                                placeholder="e.g., Master Teacher I - Filipino Dept."
                                className="w-full px-3 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                New Adviser Access PIN
                              </label>
                              <input
                                type="text"
                                value={successorPin}
                                onChange={(e) => setSuccessorPin(e.target.value)}
                                placeholder="1991"
                                className="w-full px-3 py-1.5 border border-stone-300 rounded font-mono focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step 3: Turnover Remarks */}
                      <div>
                        <label className="block font-bold text-stone-900 mb-1">
                          3. Official Resignation & Turnover Note
                        </label>
                        <textarea
                          rows={2}
                          value={resignReason}
                          onChange={(e) => setResignReason(e.target.value)}
                          className="w-full px-3 py-1.5 border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setIsResignModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded transition-colors shadow-xs"
                        >
                          Confirm Resignation & Transfer Advisership
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: NEWSLETTER SUBSCRIBERS */}
              {activeTab === 'subscribers' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        Monthly Digital Newsletter Subscribers
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Active community readers, parents, alumni, and students signed up for monthly school publication highlights.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const csvContent =
                          'data:text/csv;charset=utf-8,' +
                          ['Email,Role,Subscribed Date,Beats']
                            .concat(
                              subscribersList.map(
                                (s) =>
                                  `"${s.email}","${s.role}","${s.subscribedAt}","${s.preferredBeats.join('; ')}"`
                              )
                            )
                            .join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', 'inkspirer-subscribers-list.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showToast('Subscribers CSV exported');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Subscribers (.csv)</span>
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#FBF9F5] border border-stone-200 rounded p-3 text-center">
                      <div className="text-xl font-bold font-serif text-[#0B2545]">
                        {subscribersList.length + 342}
                      </div>
                      <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                        Total Audience
                      </div>
                    </div>
                    <div className="bg-[#FBF9F5] border border-stone-200 rounded p-3 text-center">
                      <div className="text-xl font-bold font-serif text-emerald-700">98.4%</div>
                      <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                        Deliverability
                      </div>
                    </div>
                    <div className="bg-[#FBF9F5] border border-stone-200 rounded p-3 text-center">
                      <div className="text-xl font-bold font-serif text-[#FB923C]">Monthly</div>
                      <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                        1st Monday Schedule
                      </div>
                    </div>
                    <div className="bg-[#FBF9F5] border border-stone-200 rounded p-3 text-center">
                      <div className="text-xl font-bold font-serif text-[#C084FC]">Zero Spam</div>
                      <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                        DepEd Privacy
                      </div>
                    </div>
                  </div>

                  {/* Subscriber Table */}
                  <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Subscriber Email</th>
                          <th className="px-4 py-3">Community Role</th>
                          <th className="px-4 py-3">Preferred Beats</th>
                          <th className="px-4 py-3">Date Subscribed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {/* Sample Baseline subscribers */}
                        <tr className="hover:bg-stone-50">
                          <td className="px-4 py-3 font-medium text-stone-900">
                            principal.arturo@bnhs.deped.edu.ph
                          </td>
                          <td className="px-4 py-3 text-stone-600">Faculty & Staff</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                              All Stories
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500">October 20, 2026</td>
                        </tr>
                        <tr className="hover:bg-stone-50">
                          <td className="px-4 py-3 font-medium text-stone-900">
                            alumni.pres.claros@gmail.com
                          </td>
                          <td className="px-4 py-3 text-stone-600">Alumni</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded mr-1">
                              Features
                            </span>
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                              Sports
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500">October 22, 2026</td>
                        </tr>
                        <tr className="hover:bg-stone-50">
                          <td className="px-4 py-3 font-medium text-stone-900">
                            pta.barobo.council@yahoo.com
                          </td>
                          <td className="px-4 py-3 text-stone-600">Parent / Guardian</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
                              Announcements
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500">October 23, 2026</td>
                        </tr>

                        {/* User registered subscribers */}
                        {subscribersList.map((sub) => (
                          <tr key={sub.id} className="hover:bg-stone-50 bg-amber-50/20">
                            <td className="px-4 py-3 font-medium text-stone-900">{sub.email}</td>
                            <td className="px-4 py-3 text-stone-600">{sub.role}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {sub.preferredBeats.map((b) => (
                                  <span
                                    key={b}
                                    className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-stone-500">{sub.subscribedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Publication Volume, Issue No. & Academic Year Modal inside Editorial Desk */}
        {isEditEditionModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
            <div className="bg-white text-[#1C1917] w-full max-w-lg rounded-lg shadow-2xl border border-[#681622] overflow-hidden">
              <div className="bg-[#4A0E17] text-white px-5 py-4 border-b border-[#34070E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <InkspirerLogo size="sm" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3C562]">
                      The Inkspirer · Publication Dateline, Circulation & ISSN Menu
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Edit Issue & S.Y. · Edit Circulation & ISSN
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditEditionModalOpen(false)}
                  className="p-1.5 rounded text-stone-300 hover:text-white hover:bg-[#5C1521] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditionFromDesk} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Volume & Issue Number (Auto-Generates New ISSN on Change)
                  </label>
                  <input
                    type="text"
                    required
                    value={deskVolumeIssue}
                    onChange={(e) => handleDeskVolumeIssueChange(e.target.value)}
                    placeholder="e.g. Vol. XXIV · Issue No. 1"
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      'Vol. XXIV · Issue No. 1',
                      'Vol. XXIV · Issue No. 2',
                      'Vol. XXIV · Special RSPC Edition',
                      'Vol. XXV · Issue No. 1',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleDeskVolumeIssueChange(preset)}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          deskVolumeIssue === preset
                            ? 'bg-[#4A0E17] text-[#F3C562] border-[#4A0E17] font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    School Year / Academic Year (S.Y.)
                  </label>
                  <input
                    type="text"
                    required
                    value={deskAcademicYear}
                    onChange={(e) => setDeskAcademicYear(e.target.value)}
                    placeholder="e.g. S.Y. 2026–2027 or Academic Year 2026–2027"
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      'S.Y. 2026–2027',
                      'Academic Year 2026–2027',
                      'S.Y. 2027–2028',
                      'Academic Year 2027–2028',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDeskAcademicYear(preset)}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          deskAcademicYear === preset
                            ? 'bg-[#4A0E17] text-[#F3C562] border-[#4A0E17] font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Circulation Statement
                  </label>
                  <input
                    type="text"
                    required
                    value={deskCirculation}
                    onChange={(e) => setDeskCirculation(e.target.value)}
                    placeholder="Circulation: 2,800+ Students & Faculty"
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      Electronic ISSN (Auto-Generated per Volume & Issue)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setDeskIssn(generateRandomElectronicIssn());
                        setDeskIssnAutoNotice(true);
                      }}
                      className="text-[11px] font-bold text-[#4A0E17] hover:underline cursor-pointer"
                    >
                      Generate New ISSN
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={deskIssn}
                    onChange={(e) => {
                      setDeskIssn(e.target.value);
                      setDeskIssnAutoNotice(false);
                    }}
                    placeholder="ISSN 2984-7125 (Electronic)"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                  {deskIssnAutoNotice && (
                    <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                      Auto-generated ISSN <strong>{deskIssn}</strong> for <strong>{deskVolumeIssue}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Publication Motto (“Ideas in ink. Voices in motion.”)
                  </label>
                  <input
                    type="text"
                    required
                    value={deskMotto}
                    onChange={(e) => setDeskMotto(e.target.value)}
                    placeholder="“Ideas in ink. Voices in motion.”"
                    className="w-full px-3 py-2 text-xs font-serif italic font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Masthead Subtitle & Tagline Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deskTaglineDescription}
                    onChange={(e) => setDeskTaglineDescription(e.target.value)}
                    placeholder="Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place."
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={deskSyncLeadIssue}
                    onChange={(e) => setDeskSyncLeadIssue(e.target.checked)}
                    className="rounded border-stone-300 text-[#4A0E17] focus:ring-[#4A0E17]"
                  />
                  <span>Also update the front-page Lead Story issue badge to match</span>
                </label>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditEditionModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#F3C562] rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#4A0E17]" />
                    <span>Save Publication Settings</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dedicated Edit Motto & Tagline Description Modal inside Editorial Desk */}
        {isEditMottoModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
            <div className="bg-white text-[#1C1917] w-full max-w-lg rounded-lg shadow-2xl border border-[#681622] overflow-hidden">
              <div className="bg-[#4A0E17] text-white px-5 py-4 border-b border-[#34070E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <InkspirerLogo size="sm" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#F3C562]">
                      The Inkspirer · Masthead Motto & Tagline Menu
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Edit Motto & Masthead Description
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMottoModalOpen(false)}
                  className="p-1.5 rounded text-stone-300 hover:text-white hover:bg-[#5C1521] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMottoFromDesk} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Publication Motto (Displayed under THE OFFICIAL DIGITAL NEWSLETTER PORTAL)
                  </label>
                  <input
                    type="text"
                    required
                    value={deskMotto}
                    onChange={(e) => setDeskMotto(e.target.value)}
                    placeholder="“Ideas in ink. Voices in motion.”"
                    className="w-full px-3 py-2 text-sm font-serif italic font-semibold border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      '“Ideas in ink. Voices in motion.”',
                      '“Truth in every line. Courage in every voice.”',
                      '“Empowering Barobo youth through fearless campus journalism.”',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDeskMotto(preset)}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          deskMotto === preset
                            ? 'bg-[#4A0E17] text-[#F3C562] border-[#4A0E17] font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Masthead Subtitle & Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deskTaglineDescription}
                    onChange={(e) => setDeskTaglineDescription(e.target.value)}
                    placeholder="Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place."
                    className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17] focus:outline-none text-stone-900 leading-relaxed"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.',
                      'Official student journalism, investigative reports, literary features, sports coverage, and campus advisories of Barobo National High School.',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDeskTaglineDescription(preset)}
                        className={`px-2 py-1 text-[11px] rounded border text-left transition-colors cursor-pointer ${
                          deskTaglineDescription === preset
                            ? 'bg-[#4A0E17] text-[#F3C562] border-[#4A0E17] font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="rounded-lg bg-[#4A0E17] text-white p-4 text-center space-y-1.5 border border-[#681622]">
                  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#D4AF37]">
                    THE OFFICIAL DIGITAL NEWSLETTER PORTAL
                  </div>
                  <div className="font-serif italic text-base text-stone-100">
                    {deskMotto || '“Ideas in ink. Voices in motion.”'}
                  </div>
                  <div className="text-xs text-stone-200 leading-relaxed pt-1">
                    {deskTaglineDescription ||
                      'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.'}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMottoModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-[#2A050B] bg-[#D4AF37] hover:bg-[#F3C562] rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#4A0E17]" />
                    <span>Save Motto & Description</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
