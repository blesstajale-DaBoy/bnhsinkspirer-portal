export type EditorialRoleId =
  | 'publication-adviser'
  | 'editor-in-chief'
  | 'associate-editor'
  | 'managing-editor'
  | 'news-editor'
  | 'features-editor'
  | 'opinion-editor'
  | 'sports-editor'
  | 'chief-photojournalism'
  | 'staff-writer';

export type DeskTabId =
  | 'submissions'
  | 'compose'
  | 'articles'
  | 'announcements'
  | 'categories'
  | 'staff'
  | 'author-bios'
  | 'adviser'
  | 'subscribers';

export interface EditorialRoleConfig {
  id: EditorialRoleId;
  title: string;
  shortTitle: string;
  authRole: 'adviser' | 'editor';
  defaultPassword: string;
  department: string;
  beatScope?: string; // e.g., 'News', 'Features', 'Opinion', 'Sports'
  ownArticlesOnly?: boolean; // For Staff Writer
  allowedTabs: DeskTabId[];
  defaultTab: DeskTabId;
  canEditEdition: boolean; // Issue & S.Y., Circulation & ISSN
  canEditMotto: boolean; // Motto & Tagline
  canUploadSlideMedia: boolean; // 1000x500 Slide Photo / Video
  canManageAutoSync: boolean;
  canResetDemo: boolean;
  taskSummary: string;
  tasksList: string[];
}

export const EDITORIAL_ROLES: EditorialRoleConfig[] = [
  {
    id: 'publication-adviser',
    title: 'Publication Adviser',
    shortTitle: 'Adviser',
    authRole: 'adviser',
    defaultPassword: 'adviser2026',
    department: 'School Publication Office & Editorial Consultancy',
    allowedTabs: [
      'submissions',
      'compose',
      'articles',
      'announcements',
      'categories',
      'staff',
      'author-bios',
      'adviser',
      'subscribers',
    ],
    defaultTab: 'submissions',
    canEditEdition: true,
    canEditMotto: true,
    canUploadSlideMedia: true,
    canManageAutoSync: true,
    canResetDemo: true,
    taskSummary: 'Full oversight of publication governance, adviser handover, staff roster, and live publishing.',
    tasksList: [
      'Oversee all submissions, articles, announcements, and categories',
      'Manage Editorial Board roster, Author Bios, and Adviser Handover',
      'Configure Issue & S.Y., Circulation & ISSN, Motto, Slider Media, and Auto-Sync',
    ],
  },
  {
    id: 'editor-in-chief',
    title: 'Editor-in-Chief',
    shortTitle: 'Editor-in-Chief',
    authRole: 'editor',
    defaultPassword: 'eic2026',
    department: 'Executive Editorial Board',
    allowedTabs: [
      'submissions',
      'compose',
      'articles',
      'announcements',
      'categories',
      'author-bios',
    ],
    defaultTab: 'submissions',
    canEditEdition: true,
    canEditMotto: true,
    canUploadSlideMedia: true,
    canManageAutoSync: true,
    canResetDemo: false,
    taskSummary: 'Lead newsroom editorial direction, approve manuscripts across all desks, and manage front-page stories.',
    tasksList: [
      'Review and publish manuscripts across all campus beats',
      'Manage live articles, front-page lead stories, and masthead edition info',
      'Update categories, announcements, author bios, and featured slider media',
    ],
  },
  {
    id: 'associate-editor',
    title: 'Associate Editor',
    shortTitle: 'Associate Ed.',
    authRole: 'editor',
    defaultPassword: 'associate2026',
    department: 'Executive Editorial Board',
    allowedTabs: ['submissions', 'compose', 'articles', 'announcements', 'author-bios'],
    defaultTab: 'submissions',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Coordinate story editing, copy-check student submissions, and assist with campus dispatches.',
    tasksList: [
      'Review, copy-edit, and approve incoming student submissions',
      'Publish and refine live stories across campus sections',
      'Post campus notices and maintain student journalist author profiles',
    ],
  },
  {
    id: 'managing-editor',
    title: 'Managing Editor',
    shortTitle: 'Managing Ed.',
    authRole: 'editor',
    defaultPassword: 'managing2026',
    department: 'Operations & Circulation Desk',
    allowedTabs: ['submissions', 'articles', 'announcements', 'categories', 'subscribers'],
    defaultTab: 'announcements',
    canEditEdition: true,
    canEditMotto: false,
    canUploadSlideMedia: false,
    canManageAutoSync: true,
    canResetDemo: false,
    taskSummary: 'Oversee production workflow, publication schedule, campus announcements, categories, and subscribers.',
    tasksList: [
      'Manage issue numbering, School Year, circulation, and Electronic ISSN',
      'Publish and pin Campus Announcements & Notices',
      'Monitor submission pipeline, section categories, and newsletter subscribers',
    ],
  },
  {
    id: 'news-editor',
    title: 'News Editor',
    shortTitle: 'News Editor',
    authRole: 'editor',
    defaultPassword: 'news2026',
    department: 'News Desk',
    beatScope: 'News',
    allowedTabs: ['submissions', 'compose', 'articles', 'announcements'],
    defaultTab: 'submissions',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Manage campus news reporting, verify News submissions, and publish breaking school announcements.',
    tasksList: [
      'Review and approve News beat submissions',
      'Write, edit, and publish News articles & News slider media',
      'Post official campus and academic notices',
    ],
  },
  {
    id: 'features-editor',
    title: 'Features Editor',
    shortTitle: 'Features Ed.',
    authRole: 'editor',
    defaultPassword: 'features2026',
    department: 'Features & Literary Desk',
    beatScope: 'Features',
    allowedTabs: ['submissions', 'compose', 'articles', 'author-bios'],
    defaultTab: 'submissions',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Curate human-interest profiles, campus culture pieces, and Features section storytelling.',
    tasksList: [
      'Review and approve Features beat submissions',
      'Compose, edit, and manage Features stories & Features slider media',
      'Update feature writer bios and student profiles',
    ],
  },
  {
    id: 'opinion-editor',
    title: 'Opinion Editor',
    shortTitle: 'Opinion Ed.',
    authRole: 'editor',
    defaultPassword: 'opinion2026',
    department: 'Opinion & Editorial Desk',
    beatScope: 'Opinion',
    allowedTabs: ['submissions', 'compose', 'articles'],
    defaultTab: 'submissions',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Oversee editorials, student columns, and campus commentary in the Opinion section.',
    tasksList: [
      'Review and moderate Opinion submissions and columns',
      'Compose and edit Opinion & editorial pieces',
      'Manage Opinion featured slider visuals',
    ],
  },
  {
    id: 'sports-editor',
    title: 'Sports Editor',
    shortTitle: 'Sports Editor',
    authRole: 'editor',
    defaultPassword: 'sports2026',
    department: 'Sports & Athletics Desk',
    beatScope: 'Sports',
    allowedTabs: ['submissions', 'compose', 'articles'],
    defaultTab: 'submissions',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Cover BNHS athletics, tournament recaps, intramurals, and Sports section highlights.',
    tasksList: [
      'Review and approve Sports beat manuscripts',
      'Publish and update Sports stories and game highlights',
      'Upload Sports 1000×500 highlight photos or videos',
    ],
  },
  {
    id: 'chief-photojournalism',
    title: 'Chief Photojournalism',
    shortTitle: 'Chief Photo',
    authRole: 'editor',
    defaultPassword: 'photo2026',
    department: 'Photojournalism & Visual Media Desk',
    allowedTabs: ['articles', 'categories'],
    defaultTab: 'articles',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: true,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Lead visual storytelling, upload 1000×500 slider photos/videos, manage article imagery, and update section covers.',
    tasksList: [
      'Upload and update 1000×500 featured slider photos & videos (YouTube, Drive, .mp4)',
      'Attach or replace story hero photos and photojournalism captions',
      'Maintain section cover artwork across publication categories',
    ],
  },
  {
    id: 'staff-writer',
    title: 'Staff Writer',
    shortTitle: 'Staff Writer',
    authRole: 'editor',
    defaultPassword: 'writer2026',
    department: 'Campus Reporting Corps',
    ownArticlesOnly: true,
    allowedTabs: ['compose', 'articles', 'author-bios'],
    defaultTab: 'compose',
    canEditEdition: false,
    canEditMotto: false,
    canUploadSlideMedia: false,
    canManageAutoSync: false,
    canResetDemo: false,
    taskSummary: 'Draft and publish assigned campus articles, update your own published stories, and maintain your journalist bio.',
    tasksList: [
      'Write and publish new campus journalism stories',
      'View and edit your own published stories',
      'Keep your Student Journalist Author Bio Profile up to date',
    ],
  },
];

export function getEditorialRoleConfig(roleId?: string | null): EditorialRoleConfig | null {
  if (!roleId) return null;
  return EDITORIAL_ROLES.find((r) => r.id === roleId) || null;
}

/**
 * Deterministic password hashing using Web Crypto SHA-256 (with synchronous fallback)
 * so custom role passwords are never stored in plain text in localStorage or Firestore.
 */
export async function hashRolePassword(roleId: EditorialRoleId, plainPassword: string): Promise<string> {
  const input = `inkspirer-bnhs-v1:${roleId}:${plainPassword.trim()}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below
  }

  // Fallback FNV-1a 64-bit-style hex hash if crypto.subtle is unavailable
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `fnv-${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}
