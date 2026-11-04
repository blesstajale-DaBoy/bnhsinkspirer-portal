export type Category = string;

export interface PublicationCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  iconName?: string;
  imageUrl?: string;
  isDefault?: boolean;
}

export interface StudentAuthorProfile {
  id: string;
  name: string;
  role: string;
  gradeSection: string;
  beat: string;
  bio: string;
  journalismMotto?: string;
  accolades?: string[];
  photoUrl?: string;
  avatarSeed?: string;
  email?: string;
  joinedYear?: string;
}

export interface Article {
  id: string;
  title: string;
  deck: string;
  category: Category;
  author: string;
  authorRole: string;
  authorBio?: string;
  authorAvatar?: string;
  authorProfileId?: string;
  authorPhotoUrl?: string;
  authorGradeSection?: string;
  authorMotto?: string;
  authorAccolades?: string[];
  date: string;
  readTime: string;
  featured?: boolean;
  leadStory?: boolean;
  content: string[];
  pullQuote?: string;
  imageCaption?: string;
  imageUrl?: string;
  categoryTheme: {
    accentColor: string;
    badgeBg: string;
    badgeText: string;
  };
  views: number;
  likes: number;
  issue: string;
}

export interface Announcement {
  id: string;
  title: string;
  type: 'Urgent' | 'Academic' | 'Press' | 'Event' | 'General';
  date: string;
  deadline?: string;
  location?: string;
  content: string;
  urgent?: boolean;
  isPinned?: boolean;
}

export interface StorySubmission {
  id: string;
  studentName: string;
  gradeSection: string;
  email: string;
  category: Category;
  headline: string;
  summary: string;
  content: string;
  notesToEditor?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  editorFeedback?: string;
}

export interface EditorialMember {
  id: string;
  name: string;
  role: string;
  gradeOrDesignation: string;
  department: string;
  avatarSeed: string;
  photoUrl?: string;
  email?: string;
  isPrimaryAdviser?: boolean;
  adviserStatus?: 'active' | 'emeritus' | 'resigned';
  resignedDate?: string;
}

export interface PortalAdviserConfig {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  pinCode: string;
  photoUrl?: string;
  appointedDate: string;
}

export interface AdviserHandoverRecord {
  id: string;
  previousAdviserName: string;
  previousAdviserDisposition: 'emeritus' | 'removed';
  newAdviserName: string;
  newAdviserDesignation: string;
  handoverDate: string;
  reasonOrNote: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  role: 'Student' | 'Parent / Guardian' | 'Faculty & Staff' | 'Alumni' | 'Community Supporter';
  preferredBeats: (Category | 'All')[];
  subscribedAt: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  authorName: string;
  authorRole?: string;
  message: string;
  createdAt: string;
  likes: number;
}

export interface PublicationEditionConfig {
  volumeIssue: string;
  academicYear: string;
  circulation?: string;
  issn?: string;
  motto?: string;
  taglineDescription?: string;
}

/**
 * Generates an official-format Electronic ISSN (ISSN 2984-XXXX (Electronic))
 * whenever a new Volume / Issue No. is entered or selected.
 * Preserves 'ISSN 2984-7125 (Electronic)' for the default 'Vol. XXIV · Issue No. 1'.
 */
export function generateIssnForVolumeIssue(volumeIssue: string): string {
  const normalized = volumeIssue.trim().replace(/\s+/g, ' ');
  if (
    !normalized ||
    normalized.toLowerCase() === 'vol. xxiv · issue no. 1' ||
    normalized.toLowerCase() === 'vol. xxiv · issue 1'
  ) {
    return 'ISSN 2984-7125 (Electronic)';
  }

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const threeDigits = (Math.abs(hash) % 900) + 100; // 100..999
  const first7 = `2984${threeDigits}`;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(first7[i], 10) * (8 - i);
  }
  const rem = sum % 11;
  const checkDigit = rem === 0 ? '0' : rem === 1 ? 'X' : String(11 - rem);
  return `ISSN 2984-${threeDigits}${checkDigit} (Electronic)`;
}

export function generateRandomElectronicIssn(): string {
  const threeDigits = Math.floor(100 + Math.random() * 900);
  const first7 = `2984${threeDigits}`;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(first7[i], 10) * (8 - i);
  }
  const rem = sum % 11;
  const checkDigit = rem === 0 ? '0' : rem === 1 ? 'X' : String(11 - rem);
  return `ISSN 2984-${threeDigits}${checkDigit} (Electronic)`;
}



