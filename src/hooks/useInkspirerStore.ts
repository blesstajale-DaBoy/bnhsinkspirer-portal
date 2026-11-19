import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Article,
  Announcement,
  StorySubmission,
  EditorialMember,
  Category,
  PublicationCategory,
  StudentAuthorProfile,
  PublicationEditionConfig,
  PortalAdviserConfig,
  AdviserHandoverRecord,
  generateIssnForVolumeIssue,
} from '../types';
import {
  INITIAL_ARTICLES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_EDITORIAL_STAFF,
  INITIAL_CATEGORIES,
  INITIAL_AUTHOR_PROFILES,
} from '../data/initialData';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, OperationType, buildFirestoreErrorInfo } from '../lib/firebase';
import { DEFAULT_SAMPLE_ARTICLE_VIDEOS } from '../utils/videoUrl';

const STORAGE_KEYS = {
  ARTICLES: 'the_inkspirer_articles_v1',
  ANNOUNCEMENTS: 'the_inkspirer_announcements_v1',
  SUBMISSIONS: 'the_inkspirer_submissions_v1',
  STAFF: 'the_inkspirer_staff_v1',
  BOOKMARKS: 'the_inkspirer_bookmarks_v1',
  READING_PROGRESS: 'the_inkspirer_reading_progress_v1',
  LIKED: 'the_inkspirer_liked_v1',
  CATEGORIES: 'the_inkspirer_categories_v1',
  AUTHOR_PROFILES: 'the_inkspirer_author_profiles_v1',
  EDITION_CONFIG: 'the_inkspirer_edition_config_v1',
  ACTIVE_ADVISER: 'the_inkspirer_active_adviser_v1',
  HANDOVER_LOG: 'the_inkspirer_adviser_handover_log_v1',
  AUTO_SYNC: 'the_inkspirer_auto_sync_v1',
  SAMPLE_VIDEOS_SEEDED: 'the_inkspirer_sample_videos_seeded_v1',
};

const DEFAULT_EDITION_CONFIG: PublicationEditionConfig = {
  volumeIssue: 'Vol. XXIV · Issue No. 1',
  academicYear: 'Academic Year 2026–2027',
  circulation: 'Circulation: 2,800+ Students & Faculty',
  issn: 'ISSN 2984-7125 (Electronic)',
  motto: '“Ideas in ink. Voices in motion.”',
  taglineDescription:
    'Campus news, student perspectives, inspiring features, sports highlights, and school announcements—all in one place.',
};

const DEFAULT_ACTIVE_ADVISER: PortalAdviserConfig = {
  id: 'staff-1',
  name: 'Mrs. Maria Elena V. Delos Reyes',
  email: 'm.reyes@bnhs.deped.edu.ph',
  role: 'School Publication Adviser',
  designation: 'Master Teacher II - English Department',
  department: 'Adviser & Editorial Consultant',
  pinCode: '1991',
  appointedDate: 'August 2024',
};

export type CloudSyncStatus = 'synced' | 'syncing' | 'error';

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (item && typeof item === 'object' ? stripUndefined(item) : item)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    Object.keys(obj as Record<string, any>).forEach((key) => {
      const val = (obj as Record<string, any>)[key];
      if (val !== undefined) {
        cleaned[key] = val && typeof val === 'object' ? stripUndefined(val) : val;
      }
    });
    return cleaned as T;
  }
  return obj;
}

const pendingStorageTimers = new Map<string, number>();

function safeLocalStorageSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  const existing = pendingStorageTimers.get(key);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }
  const timer = window.setTimeout(() => {
    pendingStorageTimers.delete(key);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`localStorage write warning for ${key}:`, err);
    }
  }, 200);
  pendingStorageTimers.set(key, timer);
}

function getArticleTimestamp(id: string): number {
  const match = id.match(/^art-(\d{10,})$/);
  return match ? parseInt(match[1], 10) : 0;
}

function sortArticlesNewestFirst(list: Article[]): Article[] {
  return [...list].sort((a, b) => {
    const timeA = getArticleTimestamp(a.id);
    const timeB = getArticleTimestamp(b.id);
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return 0;
  });
}

function compressDataUrlForFirestore(dataUrl: string, maxDimension = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function prepareFirestorePayload(
  collectionName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const cleaned: Record<string, any> = stripUndefined(data);

  // Enforce required fields & maxLength constraints matching firestore.rules
  if (collectionName === 'articles') {
    if (typeof cleaned.title === 'string' && cleaned.title.length > 1000) {
      cleaned.title = cleaned.title.slice(0, 1000);
    }
    if (!cleaned.category) cleaned.category = 'News';
  } else if (collectionName === 'announcements') {
    if (typeof cleaned.title === 'string' && cleaned.title.length > 1000) {
      cleaned.title = cleaned.title.slice(0, 1000);
    }
    if (typeof cleaned.content === 'string' && cleaned.content.length > 20000) {
      cleaned.content = cleaned.content.slice(0, 20000);
    }
    if (!cleaned.date) {
      cleaned.date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (!cleaned.type) cleaned.type = 'General';
  } else if (collectionName === 'categories') {
    if (typeof cleaned.name === 'string' && cleaned.name.length > 256) {
      cleaned.name = cleaned.name.slice(0, 256);
    }
    if (!cleaned.slug && cleaned.name) {
      cleaned.slug = String(cleaned.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'category';
    }
    if (!cleaned.color) cleaned.color = '#FB923C';
  } else if (collectionName === 'editorialStaff') {
    if (typeof cleaned.name === 'string' && cleaned.name.length > 500) {
      cleaned.name = cleaned.name.slice(0, 500);
    }
    if (!cleaned.role) cleaned.role = 'Staff Writer';
  } else if (collectionName === 'authorProfiles') {
    if (typeof cleaned.name === 'string' && cleaned.name.length > 500) {
      cleaned.name = cleaned.name.slice(0, 500);
    }
    if (typeof cleaned.bio === 'string' && cleaned.bio.length > 10000) {
      cleaned.bio = cleaned.bio.slice(0, 10000);
    }
    if (!cleaned.bio) {
      cleaned.bio = 'Student journalist at Barobo National High School writing for The Inkspirer.';
    }
    if (!cleaned.role) cleaned.role = 'Student Journalist';
  }

  // Prevent oversized inline data:video/ strings from breaking Firestore's 1 MiB document limit
  if (
    typeof cleaned.videoUrl === 'string' &&
    cleaned.videoUrl.startsWith('data:video/') &&
    cleaned.videoUrl.length > 650000
  ) {
    delete cleaned.videoUrl;
  }

  // Ensure embedded data URI images fit safely within Firestore's 1 MiB document limit
  try {
    let serialized = JSON.stringify(cleaned);
    if (serialized.length > 750000) {
      const imageFields = ['imageUrl', 'photoUrl', 'authorPhotoUrl'] as const;
      for (const field of imageFields) {
        if (typeof cleaned[field] === 'string' && cleaned[field].startsWith('data:image/')) {
          cleaned[field] = await compressDataUrlForFirestore(cleaned[field], 800, 0.65);
        }
      }
      serialized = JSON.stringify(cleaned);
      if (serialized.length > 880000) {
        for (const field of imageFields) {
          if (typeof cleaned[field] === 'string' && cleaned[field].startsWith('data:image/')) {
            cleaned[field] = await compressDataUrlForFirestore(cleaned[field], 560, 0.55);
          }
        }
      }
    }
  } catch {
    // ignore serialization check failure
  }

  return cleaned;
}

function mergeAndOrderCategories(loaded: PublicationCategory[]): PublicationCategory[] {
  const coreOrder = ['News', 'Features', 'Opinion', 'Sports', 'Announcements'];
  const result: PublicationCategory[] = [];
  const usedIds = new Set<string>();

  for (const coreName of coreOrder) {
    const initialCat = INITIAL_CATEGORIES.find(
      (c) => c.name.toLowerCase() === coreName.toLowerCase()
    );
    const existingMatch = loaded.find(
      (c) =>
        (initialCat && c.id === initialCat.id) ||
        c.name.toLowerCase() === coreName.toLowerCase() ||
        (coreName === 'Announcements' && c.name.toLowerCase() === 'announcement')
    );

    if (existingMatch) {
      result.push(existingMatch);
      usedIds.add(existingMatch.id);
    } else if (initialCat) {
      result.push(initialCat);
      usedIds.add(initialCat.id);
    }
  }

  for (const cat of loaded) {
    if (!usedIds.has(cat.id)) {
      result.push(cat);
      usedIds.add(cat.id);
    }
  }

  return result;
}

export function useInkspirerStore() {
  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (!stored) return INITIAL_ARTICLES;
      const parsed: Article[] = JSON.parse(stored);
      const alreadySeededSampleVideos =
        localStorage.getItem(STORAGE_KEYS.SAMPLE_VIDEOS_SEEDED) === 'true';
      const hydrated = sortArticlesNewestFirst(
        parsed.map((item) => {
          const initialMatch = INITIAL_ARTICLES.find((a) => a.id === item.id);
          const defaultSampleVideo = !alreadySeededSampleVideos
            ? DEFAULT_SAMPLE_ARTICLE_VIDEOS[item.id]
            : undefined;
          return {
            ...item,
            ...(defaultSampleVideo && !item.videoUrl ? { videoUrl: defaultSampleVideo } : {}),
            authorBio:
              item.authorBio ||
              initialMatch?.authorBio ||
              `Contributing campus writer at Barobo National High School's The Inkspirer.`,
            authorAvatar: item.authorAvatar || initialMatch?.authorAvatar || 'default',
          };
        })
      );
      if (!alreadySeededSampleVideos) {
        safeLocalStorageSet(STORAGE_KEYS.ARTICLES, hydrated);
      }
      return hydrated;
    } catch {
      return INITIAL_ARTICLES;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return stored ? JSON.parse(stored) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [submissions, setSubmissions] = useState<StorySubmission[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return stored ? JSON.parse(stored) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [staff, setStaff] = useState<EditorialMember[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STAFF);
      return stored ? JSON.parse(stored) : INITIAL_EDITORIAL_STAFF;
    } catch {
      return INITIAL_EDITORIAL_STAFF;
    }
  });

  const [categories, setCategories] = useState<PublicationCategory[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!stored) return INITIAL_CATEGORIES;
      const parsed: PublicationCategory[] = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_CATEGORIES;
      return mergeAndOrderCategories(parsed);
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [authorProfiles, setAuthorProfiles] = useState<StudentAuthorProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTHOR_PROFILES);
      if (!stored) return INITIAL_AUTHOR_PROFILES;
      const parsed: StudentAuthorProfile[] = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_AUTHOR_PROFILES;
      return parsed;
    } catch {
      return INITIAL_AUTHOR_PROFILES;
    }
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [likedArticles, setLikedArticles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [readingProgressMap, setReadingProgressMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [editionConfig, setEditionConfig] = useState<PublicationEditionConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EDITION_CONFIG);
      if (!stored) return DEFAULT_EDITION_CONFIG;
      const parsed = JSON.parse(stored);
      const vol = parsed.volumeIssue || DEFAULT_EDITION_CONFIG.volumeIssue;
      return {
        volumeIssue: vol,
        academicYear: parsed.academicYear || DEFAULT_EDITION_CONFIG.academicYear,
        circulation: parsed.circulation || DEFAULT_EDITION_CONFIG.circulation,
        issn: parsed.issn || generateIssnForVolumeIssue(vol),
        motto: parsed.motto || DEFAULT_EDITION_CONFIG.motto,
        taglineDescription:
          parsed.taglineDescription || DEFAULT_EDITION_CONFIG.taglineDescription,
      };
    } catch {
      return DEFAULT_EDITION_CONFIG;
    }
  });

  const [activeAdviserConfig, setActiveAdviserConfig] = useState<PortalAdviserConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADVISER);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_ACTIVE_ADVISER;
  });

  const [handoverHistory, setHandoverHistory] = useState<AdviserHandoverRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HANDOVER_LOG);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
      if (stored === null) return true;
      return JSON.parse(stored) !== false;
    } catch {
      return true;
    }
  });

  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const autoSyncEnabledRef = useRef<boolean>(autoSyncEnabled);
  autoSyncEnabledRef.current = autoSyncEnabled;

  const deletedIdsRef = useRef<Set<string>>(new Set());
  const pendingLocalWritesRef = useRef<Set<string>>(new Set());
  const inFlightWritesCountRef = useRef<number>(0);

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    autoSyncEnabledRef.current = enabled;
    safeLocalStorageSet(STORAGE_KEYS.AUTO_SYNC, enabled);
  }, []);

  const markWriteStart = useCallback(() => {
    inFlightWritesCountRef.current += 1;
    setSyncStatus('syncing');
  }, []);

  const markWriteEnd = useCallback((hadError = false) => {
    inFlightWritesCountRef.current = Math.max(0, inFlightWritesCountRef.current - 1);
    if (hadError) {
      setSyncStatus('error');
    } else if (inFlightWritesCountRef.current === 0) {
      setSyncStatus('synced');
      setLastSyncedAt(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }
  }, []);

  const safeSetDoc = useCallback(
    async (
      collectionName: string,
      docId: string,
      data: Record<string, any>,
      forceSync = false
    ): Promise<boolean> => {
      if (!forceSync && !autoSyncEnabledRef.current) {
        return false;
      }
      const key = `${collectionName}/${docId}`;
      pendingLocalWritesRef.current.add(key);
      markWriteStart();
      try {
        const cleanedData = await prepareFirestorePayload(collectionName, data);
        await setDoc(doc(db, collectionName, docId), cleanedData);
        if (collectionName !== 'publicationSettings' || docId !== 'syncMeta') {
          setDoc(
            doc(db, 'publicationSettings', 'syncMeta'),
            {
              initialized: true,
              lastSyncedAt: new Date().toISOString(),
              updatedAtMs: Date.now(),
            },
            { merge: true }
          ).catch(() => {});
        }
        markWriteEnd(false);
        return true;
      } catch (err) {
        const info = buildFirestoreErrorInfo(err, OperationType.WRITE, key);
        console.error('Firestore Auto-Sync Write Error:', JSON.stringify(info));
        markWriteEnd(true);
        return false;
      } finally {
        setTimeout(() => {
          pendingLocalWritesRef.current.delete(key);
        }, 2500);
      }
    },
    [markWriteStart, markWriteEnd]
  );

  const safeDeleteDoc = useCallback(
    async (collectionName: string, docId: string, forceSync = false): Promise<boolean> => {
      if (!forceSync && !autoSyncEnabledRef.current) {
        return false;
      }
      const key = `${collectionName}/${docId}`;
      markWriteStart();
      try {
        await deleteDoc(doc(db, collectionName, docId));
        setDoc(
          doc(db, 'publicationSettings', 'syncMeta'),
          {
            initialized: true,
            lastSyncedAt: new Date().toISOString(),
            updatedAtMs: Date.now(),
          },
          { merge: true }
        ).catch(() => {});
        markWriteEnd(false);
        return true;
      } catch (err) {
        const info = buildFirestoreErrorInfo(err, OperationType.DELETE, key);
        console.error('Firestore Auto-Sync Delete Error:', JSON.stringify(info));
        markWriteEnd(true);
        return false;
      }
    },
    [markWriteStart, markWriteEnd]
  );

  // Real-time Firestore Auto-Sync Listeners (Preview <-> Published Live single source of truth)
  useEffect(() => {
    let isMounted = true;
    let isCloudInitialized = false;

    const checkInitialized = async (): Promise<boolean> => {
      if (isCloudInitialized) return true;
      try {
        const metaSnap = await getDoc(doc(db, 'publicationSettings', 'syncMeta'));
        if (metaSnap.exists() && metaSnap.data()?.initialized) {
          isCloudInitialized = true;
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    // 1. Articles Firestore listener
    const unsubArticles = onSnapshot(
      collection(db, 'articles'),
      async (snap) => {
        if (!isMounted) return;
        if (!snap.empty) {
          isCloudInitialized = true;
          const cloudArtsRaw = snap.docs.map((d) => d.data() as Article);
          const alreadySeededSampleVideos =
            localStorage.getItem(STORAGE_KEYS.SAMPLE_VIDEOS_SEEDED) === 'true';
          const articlesToSeedInCloud: Article[] = [];
          const cloudArts = cloudArtsRaw.map((art) => {
            const sampleVideo = !alreadySeededSampleVideos
              ? DEFAULT_SAMPLE_ARTICLE_VIDEOS[art.id]
              : undefined;
            if (sampleVideo && !art.videoUrl) {
              const seeded = stripUndefined({ ...art, videoUrl: sampleVideo });
              articlesToSeedInCloud.push(seeded);
              return seeded;
            }
            return art;
          });
          if (!alreadySeededSampleVideos) {
            try {
              localStorage.setItem(STORAGE_KEYS.SAMPLE_VIDEOS_SEEDED, 'true');
            } catch {
              // ignore
            }
            articlesToSeedInCloud.forEach((seededArt) => {
              safeSetDoc('articles', seededArt.id, seededArt);
            });
          }
          setArticles((prev) => {
            const cloudIds = new Set(cloudArts.map((a) => a.id));
            const mergedFromCloud = cloudArts.filter((a) => !deletedIdsRef.current.has(a.id));
            // Only keep local items actively pending write confirmation in THIS session
            const pendingOnly = prev.filter(
              (p) =>
                !cloudIds.has(p.id) &&
                !deletedIdsRef.current.has(p.id) &&
                pendingLocalWritesRef.current.has(`articles/${p.id}`)
            );
            const sorted = sortArticlesNewestFirst([...pendingOnly, ...mergedFromCloud]);
            safeLocalStorageSet(STORAGE_KEYS.ARTICLES, sorted);
            return sorted;
          });
          setLastSyncedAt(
            new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          );
        } else {
          const alreadyInit = await checkInitialized();
          if (!alreadyInit) {
            INITIAL_ARTICLES.forEach((art) => {
              safeSetDoc('articles', art.id, art, true);
            });
          } else {
            setArticles([]);
            safeLocalStorageSet(STORAGE_KEYS.ARTICLES, []);
          }
        }
      },
      (err) => {
        console.warn('Firestore articles listener info:', err.message);
      }
    );

    // 2. Announcements Firestore listener
    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      async (snap) => {
        if (!isMounted) return;
        if (!snap.empty) {
          isCloudInitialized = true;
          const cloudAnn = snap.docs.map((d) => d.data() as Announcement);
          setAnnouncements((prev) => {
            const cloudIds = new Set(cloudAnn.map((a) => a.id));
            const pendingOnly = prev.filter(
              (p) =>
                !cloudIds.has(p.id) &&
                !deletedIdsRef.current.has(p.id) &&
                pendingLocalWritesRef.current.has(`announcements/${p.id}`)
            );
            const merged = [
              ...pendingOnly,
              ...cloudAnn.filter((a) => !deletedIdsRef.current.has(a.id)),
            ];
            safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, merged);
            return merged;
          });
        } else {
          const alreadyInit = await checkInitialized();
          if (!alreadyInit) {
            INITIAL_ANNOUNCEMENTS.forEach((ann) => {
              safeSetDoc('announcements', ann.id, ann, true);
            });
          } else {
            setAnnouncements([]);
            safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, []);
          }
        }
      },
      (err) => {
        console.warn('Firestore announcements listener info:', err.message);
      }
    );

    // 3. Categories Firestore listener
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        if (!isMounted) return;
        if (!snap.empty) {
          isCloudInitialized = true;
          const cloudCats = snap.docs.map((d) => d.data() as PublicationCategory);
          const mergedCats = mergeAndOrderCategories(cloudCats);
          INITIAL_CATEGORIES.forEach((initCat) => {
            const existsInCloud = cloudCats.some(
              (c) =>
                c.id === initCat.id ||
                c.name.toLowerCase() === initCat.name.toLowerCase() ||
                (initCat.name === 'Announcements' && c.name.toLowerCase() === 'announcement')
            );
            if (!existsInCloud) {
              safeSetDoc('categories', initCat.id, initCat, true);
            }
          });
          setCategories(mergedCats);
          safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, mergedCats);
        } else {
          INITIAL_CATEGORIES.forEach((cat) => {
            safeSetDoc('categories', cat.id, cat, true);
          });
        }
      },
      (err) => {
        console.warn('Firestore categories listener info:', err.message);
      }
    );

    // 7. Publication Edition Config Firestore listener (Tier 1: visible in masthead above the fold)
    const unsubEdition = onSnapshot(
      doc(db, 'publicationSettings', 'edition'),
      (snap) => {
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as Partial<PublicationEditionConfig>;
          if (
            data.volumeIssue ||
            data.academicYear ||
            data.circulation ||
            data.issn ||
            data.motto ||
            data.taglineDescription
          ) {
            setEditionConfig((prev) => {
              const nextVol = data.volumeIssue || prev.volumeIssue || DEFAULT_EDITION_CONFIG.volumeIssue;
              const next: PublicationEditionConfig = {
                volumeIssue: nextVol,
                academicYear: data.academicYear || prev.academicYear || DEFAULT_EDITION_CONFIG.academicYear,
                circulation: data.circulation || prev.circulation || DEFAULT_EDITION_CONFIG.circulation,
                issn: data.issn || prev.issn || generateIssnForVolumeIssue(nextVol),
                motto: data.motto || prev.motto || DEFAULT_EDITION_CONFIG.motto,
                taglineDescription:
                  data.taglineDescription ||
                  prev.taglineDescription ||
                  DEFAULT_EDITION_CONFIG.taglineDescription,
              };
              safeLocalStorageSet(STORAGE_KEYS.EDITION_CONFIG, next);
              return next;
            });
          }
        } else {
          safeSetDoc('publicationSettings', 'edition', DEFAULT_EDITION_CONFIG, true);
        }
      },
      (err) => {
        console.warn('Firestore editionConfig listener info:', err.message);
      }
    );

    // Tier 2 secondary listeners deferred briefly so mobile first paint & scrolling stay completely fluid
    const secondaryUnsubs: (() => void)[] = [];
    const secondaryTimer = window.setTimeout(() => {
      if (!isMounted) return;

      // 4. Submissions Firestore listener
      secondaryUnsubs.push(
        onSnapshot(
          collection(db, 'submissions'),
          async (snap) => {
            if (!isMounted) return;
            if (!snap.empty) {
              isCloudInitialized = true;
              const cloudSubs = snap.docs.map((d) => d.data() as StorySubmission);
              setSubmissions((prev) => {
                const cloudIds = new Set(cloudSubs.map((s) => s.id));
                const pendingOnly = prev.filter(
                  (p) =>
                    !cloudIds.has(p.id) &&
                    !deletedIdsRef.current.has(p.id) &&
                    pendingLocalWritesRef.current.has(`submissions/${p.id}`)
                );
                const merged = [
                  ...pendingOnly,
                  ...cloudSubs.filter((s) => !deletedIdsRef.current.has(s.id)),
                ];
                safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, merged);
                return merged;
              });
            } else {
              const alreadyInit = await checkInitialized();
              if (!alreadyInit) {
                INITIAL_SUBMISSIONS.forEach((sub) => {
                  safeSetDoc('submissions', sub.id, sub, true);
                });
              } else {
                setSubmissions([]);
                safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, []);
              }
            }
          },
          (err) => {
            console.warn('Firestore submissions listener info:', err.message);
          }
        )
      );

      // 5. Staff Firestore listener
      secondaryUnsubs.push(
        onSnapshot(
          collection(db, 'editorialStaff'),
          async (snap) => {
            if (!isMounted) return;
            if (!snap.empty) {
              isCloudInitialized = true;
              const cloudStaff = snap.docs.map((d) => d.data() as EditorialMember);
              setStaff((prev) => {
                const cloudIds = new Set(cloudStaff.map((m) => m.id));
                const pendingOnly = prev.filter(
                  (p) =>
                    !cloudIds.has(p.id) &&
                    !deletedIdsRef.current.has(p.id) &&
                    pendingLocalWritesRef.current.has(`editorialStaff/${p.id}`)
                );
                const merged = [
                  ...cloudStaff.filter((m) => !deletedIdsRef.current.has(m.id)),
                  ...pendingOnly,
                ];
                safeLocalStorageSet(STORAGE_KEYS.STAFF, merged);
                return merged;
              });
            } else {
              const alreadyInit = await checkInitialized();
              if (!alreadyInit) {
                INITIAL_EDITORIAL_STAFF.forEach((member) => {
                  safeSetDoc('editorialStaff', member.id, member, true);
                });
              } else {
                setStaff([]);
                safeLocalStorageSet(STORAGE_KEYS.STAFF, []);
              }
            }
          },
          (err) => {
            console.warn('Firestore staff listener info:', err.message);
          }
        )
      );

      // 6. Student Journalist Author Bio Profiles Firestore listener
      secondaryUnsubs.push(
        onSnapshot(
          collection(db, 'authorProfiles'),
          async (snap) => {
            if (!isMounted) return;
            if (!snap.empty) {
              isCloudInitialized = true;
              const cloudProfiles = snap.docs.map((d) => d.data() as StudentAuthorProfile);
              setAuthorProfiles((prev) => {
                const cloudIds = new Set(cloudProfiles.map((p) => p.id));
                const pendingOnly = prev.filter(
                  (p) =>
                    !cloudIds.has(p.id) &&
                    !deletedIdsRef.current.has(p.id) &&
                    pendingLocalWritesRef.current.has(`authorProfiles/${p.id}`)
                );
                const merged = [
                  ...pendingOnly,
                  ...cloudProfiles.filter((p) => !deletedIdsRef.current.has(p.id)),
                ];
                safeLocalStorageSet(STORAGE_KEYS.AUTHOR_PROFILES, merged);
                return merged;
              });
            } else {
              const alreadyInit = await checkInitialized();
              if (!alreadyInit) {
                INITIAL_AUTHOR_PROFILES.forEach((prof) => {
                  safeSetDoc('authorProfiles', prof.id, prof, true);
                });
              } else {
                setAuthorProfiles([]);
                safeLocalStorageSet(STORAGE_KEYS.AUTHOR_PROFILES, []);
              }
            }
          },
          (err) => {
            console.warn('Firestore authorProfiles listener info:', err.message);
          }
        )
      );

      // 8. Active Portal Adviser Config Firestore listener
      secondaryUnsubs.push(
        onSnapshot(
          doc(db, 'publicationSettings', 'activeAdviser'),
          (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              const cloudAdviser = snap.data() as PortalAdviserConfig;
              if (cloudAdviser && cloudAdviser.name) {
                setActiveAdviserConfig(cloudAdviser);
                safeLocalStorageSet(STORAGE_KEYS.ACTIVE_ADVISER, cloudAdviser);
              }
            } else {
              let seedAdviser = DEFAULT_ACTIVE_ADVISER;
              try {
                const localStored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADVISER);
                if (localStored) {
                  const parsed = JSON.parse(localStored) as PortalAdviserConfig;
                  if (parsed && parsed.name) {
                    seedAdviser = parsed;
                  }
                }
              } catch {
                // ignore
              }
              safeSetDoc('publicationSettings', 'activeAdviser', seedAdviser, true);
            }
          },
          (err) => {
            console.warn('Firestore activeAdviser listener info:', err.message);
          }
        )
      );

      // 9. Adviser Handover Log Firestore listener
      secondaryUnsubs.push(
        onSnapshot(
          doc(db, 'publicationSettings', 'adviserHandoverLog'),
          (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              const data = snap.data() as { records?: AdviserHandoverRecord[] };
              if (Array.isArray(data?.records)) {
                setHandoverHistory(data.records);
                safeLocalStorageSet(STORAGE_KEYS.HANDOVER_LOG, data.records);
              }
            } else {
              let seedRecords: AdviserHandoverRecord[] = [];
              try {
                const localStored = localStorage.getItem(STORAGE_KEYS.HANDOVER_LOG);
                if (localStored) {
                  const parsed = JSON.parse(localStored);
                  if (Array.isArray(parsed)) seedRecords = parsed;
                }
              } catch {
                // ignore
              }
              if (seedRecords.length > 0) {
                safeSetDoc('publicationSettings', 'adviserHandoverLog', { records: seedRecords }, true);
              }
            }
          },
          (err) => {
            console.warn('Firestore adviserHandoverLog listener info:', err.message);
          }
        )
      );
    }, 900);

    return () => {
      isMounted = false;
      window.clearTimeout(secondaryTimer);
      unsubArticles();
      unsubAnnouncements();
      unsubCategories();
      unsubEdition();
      secondaryUnsubs.forEach((fn) => fn());
    };
  }, [safeSetDoc]);

  // Save local reader preferences
  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.BOOKMARKS, bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.LIKED, likedArticles);
  }, [likedArticles]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.READING_PROGRESS, readingProgressMap);
  }, [readingProgressMap]);

  // Bookmarking
  const toggleBookmark = (id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Track reading progress for Read-Later notifications
  const updateArticleReadingProgress = (id: string, progress: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    setReadingProgressMap((prev) => {
      const current = prev[id] ?? 0;
      if (clamped <= current) return prev;
      return {
        ...prev,
        [id]: clamped,
      };
    });
  };

  const markArticleAsRead = (id: string) => {
    setReadingProgressMap((prev) => ({
      ...prev,
      [id]: 100,
    }));
  };

  const resetArticleReadingProgress = (id: string) => {
    setReadingProgressMap((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  // Like article
  const toggleLike = (id: string) => {
    const isLiked = likedArticles.includes(id);
    setLikedArticles((prev) =>
      isLiked ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setArticles((prev) => {
      const next = prev.map((art) => {
        if (art.id === id) {
          const updatedArt = stripUndefined({
            ...art,
            likes: isLiked ? Math.max(0, art.likes - 1) : art.likes + 1,
          });
          safeSetDoc('articles', id, updatedArt);
          return updatedArt;
        }
        return art;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, next);
      return next;
    });
  };

  // Increment view
  const incrementView = (id: string) => {
    setArticles((prev) => {
      const next = prev.map((art) => {
        if (art.id === id) {
          const updated = stripUndefined({ ...art, views: art.views + 1 });
          safeSetDoc('articles', id, updated);
          return updated;
        }
        return art;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, next);
      return next;
    });
  };

  // Student Submissions
  const addSubmission = (
    newSub: Omit<StorySubmission, 'id' | 'submittedAt' | 'status'>
  ): StorySubmission => {
    const created: StorySubmission = stripUndefined({
      ...newSub,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pending',
    });
    setSubmissions((prev) => {
      const updated = [created, ...prev];
      safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, updated);
      return updated;
    });
    safeSetDoc('submissions', created.id, created);
    return created;
  };

  const updateSubmissionStatus = (
    id: string,
    status: StorySubmission['status'],
    feedback?: string
  ) => {
    setSubmissions((prev) => {
      const updatedList = prev.map((sub) => {
        if (sub.id === id) {
          const updated: StorySubmission = stripUndefined({
            ...sub,
            status,
            ...(feedback !== undefined
              ? { editorFeedback: feedback }
              : sub.editorFeedback !== undefined
                ? { editorFeedback: sub.editorFeedback }
                : {}),
          });
          safeSetDoc('submissions', id, updated);
          return updated;
        }
        return sub;
      });
      safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, updatedList);
      return updatedList;
    });
  };

  // Publication Adviser / Editor actions
  const publishSubmissionAsArticle = (submissionId: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    const matchedCat = categories.find((c) => c.name.toLowerCase() === sub.category.toLowerCase());
    const categoryTheme = matchedCat
      ? { accentColor: matchedCat.color, badgeBg: matchedCat.badgeBg, badgeText: matchedCat.badgeText }
      : { accentColor: '#FB923C', badgeBg: 'bg-orange-50', badgeText: 'text-orange-900' };

    const paragraphs = sub.content
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const newArticle: Article = stripUndefined({
      id: `art-${Date.now()}`,
      title: sub.headline,
      deck: sub.summary,
      category: sub.category,
      author: sub.studentName,
      authorRole: `${sub.gradeSection} (Student Contributor)`,
      authorBio:
        sub.notesToEditor ||
        `Student journalist from ${sub.gradeSection} writing for The Inkspirer at Barobo National High School.`,
      authorAvatar: 'student-contributor',
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      readTime: `${Math.max(2, Math.ceil(sub.content.split(' ').length / 200))} min read`,
      featured: false,
      leadStory: false,
      content: paragraphs.length > 0 ? paragraphs : [sub.content],
      ...(paragraphs[0] ? { pullQuote: `“${paragraphs[0].slice(0, 140)}...”` } : {}),
      categoryTheme,
      views: 1,
      likes: 0,
      issue: editionConfig.volumeIssue || 'Vol. XXIV · Issue No. 1',
    });

    setArticles((prev) => {
      const updated = [newArticle, ...prev];
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, updated);
      return updated;
    });
    safeSetDoc('articles', newArticle.id, newArticle);

    updateSubmissionStatus(
      submissionId,
      'approved',
      'Article approved and published to The Inkspirer live portal!'
    );
    return newArticle;
  };

  const createArticle = (art: Omit<Article, 'id' | 'views' | 'likes'>) => {
    const newArt: Article = stripUndefined({
      ...art,
      id: `art-${Date.now()}`,
      views: 0,
      likes: 0,
    });
    if (newArt.leadStory) {
      setArticles((prev) => {
        const updated = [
          newArt,
          ...prev.map((item) => {
            if (item.leadStory) {
              const demoted = stripUndefined({ ...item, leadStory: false });
              safeSetDoc('articles', item.id, demoted);
              return demoted;
            }
            return item;
          }),
        ];
        safeLocalStorageSet(STORAGE_KEYS.ARTICLES, updated);
        return updated;
      });
    } else {
      setArticles((prev) => {
        const updated = [newArt, ...prev];
        safeLocalStorageSet(STORAGE_KEYS.ARTICLES, updated);
        return updated;
      });
    }
    safeSetDoc('articles', newArt.id, newArt);
    return newArt;
  };

  const updateArticle = (updated: Article) => {
    const cleanedUpdated = stripUndefined(updated);
    setArticles((prev) => {
      const nextList = prev.map((item) => {
        if (item.id === cleanedUpdated.id) {
          safeSetDoc('articles', cleanedUpdated.id, cleanedUpdated);
          return cleanedUpdated;
        }
        if (cleanedUpdated.leadStory && item.leadStory && item.id !== cleanedUpdated.id) {
          const demoted = stripUndefined({ ...item, leadStory: false });
          safeSetDoc('articles', item.id, demoted);
          return demoted;
        }
        return item;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, nextList);
      return nextList;
    });
  };

  const deleteArticle = (id: string) => {
    deletedIdsRef.current.add(id);
    setArticles((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, remaining);
      return remaining;
    });
    safeDeleteDoc('articles', id);
  };

  // Announcements management
  const addAnnouncement = (ann: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = stripUndefined({
      ...ann,
      id: `ann-${Date.now()}`,
      title: ann.title.trim(),
      content: ann.content.trim(),
      date:
        ann.date ||
        new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      ...(ann.deadline?.trim() ? { deadline: ann.deadline.trim() } : { deadline: undefined }),
      ...(ann.location?.trim() ? { location: ann.location.trim() } : { location: undefined }),
    });
    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, updated);
      return updated;
    });
    safeSetDoc('announcements', newAnn.id, newAnn);
    return newAnn;
  };

  const updateAnnouncement = (id: string, updatedFields: Partial<Announcement>) => {
    setAnnouncements((prev) => {
      const updatedList = prev.map((a) => {
        if (a.id !== id) return a;
        const mergedRaw: Announcement = {
          ...a,
          ...updatedFields,
          title: updatedFields.title !== undefined ? updatedFields.title.trim() : a.title,
          content: updatedFields.content !== undefined ? updatedFields.content.trim() : a.content,
        };
        if (!mergedRaw.deadline || !mergedRaw.deadline.trim()) {
          delete mergedRaw.deadline;
        } else {
          mergedRaw.deadline = mergedRaw.deadline.trim();
        }
        if (!mergedRaw.location || !mergedRaw.location.trim()) {
          delete mergedRaw.location;
        } else {
          mergedRaw.location = mergedRaw.location.trim();
        }
        const merged = stripUndefined(mergedRaw);
        safeSetDoc('announcements', id, merged);
        return merged;
      });
      safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, updatedList);
      return updatedList;
    });
  };

  const deleteAnnouncement = (id: string) => {
    deletedIdsRef.current.add(id);
    setAnnouncements((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, remaining);
      return remaining;
    });
    safeDeleteDoc('announcements', id);
  };

  const togglePinAnnouncement = (id: string) => {
    setAnnouncements((prev) => {
      const updatedList = prev.map((a) => {
        if (a.id === id) {
          const updated = stripUndefined({ ...a, isPinned: !a.isPinned });
          safeSetDoc('announcements', id, updated);
          return updated;
        }
        return a;
      });
      safeLocalStorageSet(STORAGE_KEYS.ANNOUNCEMENTS, updatedList);
      return updatedList;
    });
  };

  // Category Management CRUD
  const addCategory = (cat: Omit<PublicationCategory, 'id' | 'slug'>): PublicationCategory => {
    const slug =
      cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const newCategory: PublicationCategory = stripUndefined({
      ...cat,
      id: `cat-${Date.now()}`,
      slug,
      isDefault: false,
    });
    setCategories((prev) => {
      const updated = [...prev, newCategory];
      safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, updated);
      return updated;
    });
    safeSetDoc('categories', newCategory.id, newCategory);
    return newCategory;
  };

  const updateCategory = (id: string, updated: Partial<PublicationCategory>) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;

    const oldName = existing.name;
    const newName = updated.name?.trim() || oldName;
    const merged: PublicationCategory = stripUndefined({
      ...existing,
      ...updated,
      name: newName,
    });

    setCategories((prev) => {
      const nextCats = prev.map((c) => (c.id === id ? merged : c));
      safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, nextCats);
      return nextCats;
    });
    safeSetDoc('categories', id, merged);

    if (oldName !== newName || updated.color || updated.badgeBg || updated.badgeText) {
      setArticles((prev) => {
        const nextArts = prev.map((art) => {
          if (art.category.toLowerCase() === oldName.toLowerCase()) {
            const updArt: Article = stripUndefined({
              ...art,
              category: newName,
              categoryTheme: {
                accentColor: updated.color || art.categoryTheme.accentColor,
                badgeBg: updated.badgeBg || art.categoryTheme.badgeBg,
                badgeText: updated.badgeText || art.categoryTheme.badgeText,
              },
            });
            safeSetDoc('articles', art.id, updArt);
            return updArt;
          }
          return art;
        });
        safeLocalStorageSet(STORAGE_KEYS.ARTICLES, nextArts);
        return nextArts;
      });

      setSubmissions((prev) => {
        const nextSubs = prev.map((sub) => {
          if (sub.category.toLowerCase() === oldName.toLowerCase()) {
            const updSub = stripUndefined({ ...sub, category: newName });
            safeSetDoc('submissions', sub.id, updSub);
            return updSub;
          }
          return sub;
        });
        safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, nextSubs);
        return nextSubs;
      });
    }
  };

  const deleteCategory = (id: string, fallbackCategoryName?: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const remaining = categories.filter((c) => c.id !== id);
    const replacement = fallbackCategoryName || remaining[0]?.name || 'News';

    setCategories(remaining);
    safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, remaining);
    safeDeleteDoc('categories', id);

    setArticles((prev) => {
      const nextArts = prev.map((art) => {
        if (art.category.toLowerCase() === target.name.toLowerCase()) {
          const repCat = remaining.find((c) => c.name.toLowerCase() === replacement.toLowerCase());
          const updArt: Article = stripUndefined({
            ...art,
            category: replacement,
            categoryTheme: repCat
              ? { accentColor: repCat.color, badgeBg: repCat.badgeBg, badgeText: repCat.badgeText }
              : art.categoryTheme,
          });
          safeSetDoc('articles', art.id, updArt);
          return updArt;
        }
        return art;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, nextArts);
      return nextArts;
    });

    setSubmissions((prev) => {
      const nextSubs = prev.map((sub) => {
        if (sub.category.toLowerCase() === target.name.toLowerCase()) {
          const updSub = stripUndefined({ ...sub, category: replacement });
          safeSetDoc('submissions', sub.id, updSub);
          return updSub;
        }
        return sub;
      });
      safeLocalStorageSet(STORAGE_KEYS.SUBMISSIONS, nextSubs);
      return nextSubs;
    });
  };

  // Editorial Board & Masthead Roster CRUD
  const addStaffMember = (memberData: Omit<EditorialMember, 'id' | 'avatarSeed'>): EditorialMember => {
    const cleanName = memberData.name.trim();
    const newMember: EditorialMember = stripUndefined({
      ...memberData,
      id: `staff-${Date.now()}`,
      name: cleanName,
      role: memberData.role.trim(),
      gradeOrDesignation: memberData.gradeOrDesignation.trim(),
      department: memberData.department.trim(),
      avatarSeed: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'member',
      ...(memberData.photoUrl ? { photoUrl: memberData.photoUrl } : {}),
    });

    setStaff((prev) => {
      const updated = [...prev, newMember];
      safeLocalStorageSet(STORAGE_KEYS.STAFF, updated);
      return updated;
    });

    safeSetDoc('editorialStaff', newMember.id, newMember);

    return newMember;
  };

  const updateStaffMember = (id: string, updatedFields: Partial<EditorialMember>) => {
    setStaff((prev) => {
      const updatedList = prev.map((member) => {
        if (member.id !== id) return member;
        const mergedRaw: EditorialMember = {
          ...member,
          ...updatedFields,
          name: updatedFields.name !== undefined ? updatedFields.name.trim() : member.name,
          role: updatedFields.role !== undefined ? updatedFields.role.trim() : member.role,
          gradeOrDesignation:
            updatedFields.gradeOrDesignation !== undefined
              ? updatedFields.gradeOrDesignation.trim()
              : member.gradeOrDesignation,
          department:
            updatedFields.department !== undefined ? updatedFields.department.trim() : member.department,
        };
        if (!mergedRaw.photoUrl) {
          delete mergedRaw.photoUrl;
        }
        const merged = stripUndefined(mergedRaw);
        safeSetDoc('editorialStaff', id, merged);
        return merged;
      });
      safeLocalStorageSet(STORAGE_KEYS.STAFF, updatedList);
      return updatedList;
    });
  };

  const deleteStaffMember = (id: string) => {
    deletedIdsRef.current.add(id);
    setStaff((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.STAFF, remaining);
      return remaining;
    });
    safeDeleteDoc('editorialStaff', id);
  };

  // Student Journalist Author Bio Profile CRUD & Article Synchronization
  const addAuthorProfile = (
    profileData: Omit<StudentAuthorProfile, 'id'>
  ): StudentAuthorProfile => {
    const cleanName = profileData.name.trim();
    const newProfile: StudentAuthorProfile = stripUndefined({
      ...profileData,
      id: `author-${Date.now()}`,
      name: cleanName,
      role: profileData.role.trim() || 'Student Journalist',
      gradeSection: profileData.gradeSection.trim() || 'BNHS Campus Scribe',
      beat: profileData.beat.trim() || 'Campus News & Features',
      bio:
        profileData.bio.trim() ||
        `Student journalist at Barobo National High School writing for The Inkspirer.`,
      avatarSeed:
        profileData.avatarSeed ||
        cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        'student-journalist',
      ...(profileData.photoUrl?.trim() ? { photoUrl: profileData.photoUrl.trim() } : {}),
      ...(profileData.journalismMotto?.trim()
        ? { journalismMotto: profileData.journalismMotto.trim() }
        : {}),
      ...(profileData.email?.trim() ? { email: profileData.email.trim() } : {}),
      ...(profileData.joinedYear?.trim() ? { joinedYear: profileData.joinedYear.trim() } : {}),
      ...(profileData.accolades && profileData.accolades.length > 0
        ? { accolades: profileData.accolades }
        : {}),
    });

    setAuthorProfiles((prev) => {
      const updated = [newProfile, ...prev];
      safeLocalStorageSet(STORAGE_KEYS.AUTHOR_PROFILES, updated);
      return updated;
    });

    safeSetDoc('authorProfiles', newProfile.id, newProfile);

    setArticles((prev) => {
      const synced = prev.map((art) => {
        if (art.author.trim().toLowerCase() === cleanName.toLowerCase()) {
          const updArt: Article = stripUndefined({
            ...art,
            author: newProfile.name,
            authorRole: newProfile.role,
            authorBio: newProfile.bio,
            authorAvatar: newProfile.avatarSeed,
            authorProfileId: newProfile.id,
            authorPhotoUrl: newProfile.photoUrl,
            authorGradeSection: newProfile.gradeSection,
            authorMotto: newProfile.journalismMotto,
            authorAccolades: newProfile.accolades,
          });
          safeSetDoc('articles', updArt.id, updArt);
          return updArt;
        }
        return art;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, synced);
      return synced;
    });

    return newProfile;
  };

  const updateAuthorProfile = (
    id: string,
    updatedFields: Partial<StudentAuthorProfile>,
    previousName?: string
  ) => {
    let targetOldName = previousName || '';

    setAuthorProfiles((prev) => {
      const updatedList = prev.map((prof) => {
        if (prof.id !== id) return prof;
        targetOldName = targetOldName || prof.name;
        const mergedRaw: StudentAuthorProfile = {
          ...prof,
          ...updatedFields,
          name: updatedFields.name !== undefined ? updatedFields.name.trim() : prof.name,
          role: updatedFields.role !== undefined ? updatedFields.role.trim() : prof.role,
          gradeSection:
            updatedFields.gradeSection !== undefined
              ? updatedFields.gradeSection.trim()
              : prof.gradeSection,
          beat: updatedFields.beat !== undefined ? updatedFields.beat.trim() : prof.beat,
          bio: updatedFields.bio !== undefined ? updatedFields.bio.trim() : prof.bio,
        };
        if (!mergedRaw.photoUrl || !mergedRaw.photoUrl.trim()) {
          delete mergedRaw.photoUrl;
        }
        if (!mergedRaw.journalismMotto || !mergedRaw.journalismMotto.trim()) {
          delete mergedRaw.journalismMotto;
        }
        if (!mergedRaw.email || !mergedRaw.email.trim()) {
          delete mergedRaw.email;
        }
        if (!mergedRaw.joinedYear || !mergedRaw.joinedYear.trim()) {
          delete mergedRaw.joinedYear;
        }
        const merged = stripUndefined(mergedRaw);
        safeSetDoc('authorProfiles', id, merged);
        return merged;
      });
      safeLocalStorageSet(STORAGE_KEYS.AUTHOR_PROFILES, updatedList);
      return updatedList;
    });

    setArticles((prev) => {
      const synced = prev.map((art) => {
        const matchesId = art.authorProfileId === id;
        const matchesOldName =
          targetOldName && art.author.trim().toLowerCase() === targetOldName.trim().toLowerCase();
        const matchesNewName =
          updatedFields.name &&
          art.author.trim().toLowerCase() === updatedFields.name.trim().toLowerCase();

        if (matchesId || matchesOldName || matchesNewName) {
          const updArtRaw: Article = {
            ...art,
            author:
              updatedFields.name !== undefined ? updatedFields.name.trim() : art.author,
            authorRole:
              updatedFields.role !== undefined ? updatedFields.role.trim() : art.authorRole,
            authorBio:
              updatedFields.bio !== undefined ? updatedFields.bio.trim() : art.authorBio,
            authorProfileId: id,
            authorGradeSection:
              updatedFields.gradeSection !== undefined
                ? updatedFields.gradeSection.trim()
                : art.authorGradeSection,
            authorMotto:
              updatedFields.journalismMotto !== undefined
                ? updatedFields.journalismMotto.trim() || undefined
                : art.authorMotto,
            authorAccolades:
              updatedFields.accolades !== undefined
                ? updatedFields.accolades
                : art.authorAccolades,
            authorPhotoUrl:
              updatedFields.photoUrl !== undefined
                ? updatedFields.photoUrl.trim() || undefined
                : art.authorPhotoUrl,
          };
          if (!updArtRaw.authorPhotoUrl) delete updArtRaw.authorPhotoUrl;
          if (!updArtRaw.authorMotto) delete updArtRaw.authorMotto;
          const updArt = stripUndefined(updArtRaw);
          safeSetDoc('articles', updArt.id, updArt);
          return updArt;
        }
        return art;
      });
      safeLocalStorageSet(STORAGE_KEYS.ARTICLES, synced);
      return synced;
    });
  };

  const deleteAuthorProfile = (id: string) => {
    deletedIdsRef.current.add(id);
    setAuthorProfiles((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.AUTHOR_PROFILES, remaining);
      return remaining;
    });
    safeDeleteDoc('authorProfiles', id);
  };

  const updateEditionConfig = (
    updated: Partial<PublicationEditionConfig>,
    syncLeadStoryIssue = false
  ) => {
    setEditionConfig((prev) => {
      const nextVol = updated.volumeIssue?.trim() || prev.volumeIssue;
      const volChanged = nextVol.toLowerCase() !== prev.volumeIssue.toLowerCase();
      const explicitIssn = updated.issn?.trim();

      let nextIssn = prev.issn || DEFAULT_EDITION_CONFIG.issn!;
      if (explicitIssn && (!volChanged || explicitIssn !== prev.issn)) {
        nextIssn = explicitIssn;
      } else if (volChanged) {
        nextIssn = generateIssnForVolumeIssue(nextVol);
      }

      const next: PublicationEditionConfig = {
        volumeIssue: nextVol,
        academicYear: updated.academicYear?.trim() || prev.academicYear,
        circulation: updated.circulation?.trim() || prev.circulation || DEFAULT_EDITION_CONFIG.circulation,
        issn: nextIssn,
        motto: updated.motto?.trim() || prev.motto || DEFAULT_EDITION_CONFIG.motto,
        taglineDescription:
          updated.taglineDescription?.trim() ||
          prev.taglineDescription ||
          DEFAULT_EDITION_CONFIG.taglineDescription,
      };
      safeLocalStorageSet(STORAGE_KEYS.EDITION_CONFIG, next);
      safeSetDoc('publicationSettings', 'edition', next);

      if (syncLeadStoryIssue && next.volumeIssue) {
        setArticles((prevArts) => {
          const updatedArts = prevArts.map((art) => {
            if (art.leadStory) {
              const updArt = stripUndefined({ ...art, issue: next.volumeIssue });
              safeSetDoc('articles', updArt.id, updArt);
              return updArt;
            }
            return art;
          });
          safeLocalStorageSet(STORAGE_KEYS.ARTICLES, updatedArts);
          return updatedArts;
        });
      }

      return next;
    });
  };

  // Cloud-synced Portal Adviser Config & Handover Log
  const updateActiveAdviserConfig = useCallback(
    (nextConfig: PortalAdviserConfig) => {
      const cleaned = stripUndefined(nextConfig);
      setActiveAdviserConfig(cleaned);
      safeLocalStorageSet(STORAGE_KEYS.ACTIVE_ADVISER, cleaned);
      safeSetDoc('publicationSettings', 'activeAdviser', cleaned);
    },
    [safeSetDoc]
  );

  const addHandoverRecord = useCallback(
    (record: AdviserHandoverRecord) => {
      setHandoverHistory((prev) => {
        const updatedHistory = [stripUndefined(record), ...prev];
        safeLocalStorageSet(STORAGE_KEYS.HANDOVER_LOG, updatedHistory);
        safeSetDoc('publicationSettings', 'adviserHandoverLog', { records: updatedHistory });
        return updatedHistory;
      });
    },
    [safeSetDoc]
  );

  // Full Preview -> Published Live Cloud Sync Flush
  const syncAllToCloud = useCallback(async () => {
    const tasks: Promise<boolean>[] = [];
    articles.forEach((art) => tasks.push(safeSetDoc('articles', art.id, art, true)));
    announcements.forEach((ann) => tasks.push(safeSetDoc('announcements', ann.id, ann, true)));
    categories.forEach((cat) => tasks.push(safeSetDoc('categories', cat.id, cat, true)));
    submissions.forEach((sub) => tasks.push(safeSetDoc('submissions', sub.id, sub, true)));
    staff.forEach((member) => tasks.push(safeSetDoc('editorialStaff', member.id, member, true)));
    authorProfiles.forEach((prof) => tasks.push(safeSetDoc('authorProfiles', prof.id, prof, true)));
    tasks.push(safeSetDoc('publicationSettings', 'edition', editionConfig, true));
    tasks.push(safeSetDoc('publicationSettings', 'activeAdviser', activeAdviserConfig, true));
    tasks.push(
      safeSetDoc('publicationSettings', 'adviserHandoverLog', { records: handoverHistory }, true)
    );
    tasks.push(
      safeSetDoc(
        'publicationSettings',
        'syncMeta',
        {
          initialized: true,
          lastSyncedAt: new Date().toISOString(),
          updatedAtMs: Date.now(),
        },
        true
      )
    );
    const results = await Promise.all(tasks);
    return results.every(Boolean);
  }, [
    articles,
    announcements,
    categories,
    submissions,
    staff,
    authorProfiles,
    editionConfig,
    activeAdviserConfig,
    handoverHistory,
    safeSetDoc,
  ]);

  // Reset to factory demo data in state & Firestore
  const resetToDefaults = () => {
    deletedIdsRef.current.clear();
    setArticles(INITIAL_ARTICLES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setStaff(INITIAL_EDITORIAL_STAFF);
    setCategories(INITIAL_CATEGORIES);
    setAuthorProfiles(INITIAL_AUTHOR_PROFILES);
    setEditionConfig(DEFAULT_EDITION_CONFIG);
    setActiveAdviserConfig(DEFAULT_ACTIVE_ADVISER);
    setHandoverHistory([]);
    setBookmarks([]);
    setLikedArticles([]);
    setReadingProgressMap({});
    try {
      localStorage.clear();
    } catch {
      // ignore
    }

    INITIAL_ARTICLES.forEach((art) => {
      safeSetDoc('articles', art.id, art, true);
    });
    INITIAL_ANNOUNCEMENTS.forEach((ann) => {
      safeSetDoc('announcements', ann.id, ann, true);
    });
    INITIAL_CATEGORIES.forEach((cat) => {
      safeSetDoc('categories', cat.id, cat, true);
    });
    INITIAL_SUBMISSIONS.forEach((sub) => {
      safeSetDoc('submissions', sub.id, sub, true);
    });
    INITIAL_EDITORIAL_STAFF.forEach((member) => {
      safeSetDoc('editorialStaff', member.id, member, true);
    });
    INITIAL_AUTHOR_PROFILES.forEach((prof) => {
      safeSetDoc('authorProfiles', prof.id, prof, true);
    });
    safeSetDoc('publicationSettings', 'edition', DEFAULT_EDITION_CONFIG, true);
    safeSetDoc('publicationSettings', 'activeAdviser', DEFAULT_ACTIVE_ADVISER, true);
    safeSetDoc('publicationSettings', 'adviserHandoverLog', { records: [] }, true);
  };

  return {
    articles,
    announcements,
    submissions,
    staff,
    categories,
    authorProfiles,
    editionConfig,
    activeAdviserConfig,
    handoverHistory,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncStatus,
    lastSyncedAt,
    syncAllToCloud,
    bookmarks,
    readingProgressMap,
    likedArticles,
    toggleBookmark,
    updateArticleReadingProgress,
    markArticleAsRead,
    resetArticleReadingProgress,
    toggleLike,
    incrementView,
    addSubmission,
    updateSubmissionStatus,
    publishSubmissionAsArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    addCategory,
    updateCategory,
    deleteCategory,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addAuthorProfile,
    updateAuthorProfile,
    deleteAuthorProfile,
    updateEditionConfig,
    updateActiveAdviserConfig,
    addHandoverRecord,
    resetToDefaults,
  };
}
