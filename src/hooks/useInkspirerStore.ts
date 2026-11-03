import { useState, useEffect } from 'react';
import {
  Article,
  Announcement,
  StorySubmission,
  EditorialMember,
  Category,
  PublicationCategory,
  StudentAuthorProfile,
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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
};

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        cleaned[key] = stripUndefined(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned as T;
}

function safeSetDoc(collectionName: string, docId: string, data: Record<string, any>) {
  try {
    const cleanedData = stripUndefined(data);
    setDoc(doc(db, collectionName, docId), cleanedData).catch((err) => {
      console.warn(`Firestore ${collectionName}/${docId} sync warning:`, err);
    });
  } catch (err) {
    console.warn(`Firestore ${collectionName}/${docId} sync error:`, err);
  }
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
      return parsed.map((item) => {
        const initialMatch = INITIAL_ARTICLES.find((a) => a.id === item.id);
        return {
          ...item,
          authorBio: item.authorBio || initialMatch?.authorBio || `Contributing campus writer at Barobo National High School's The Inkspirer.`,
          authorAvatar: item.authorAvatar || initialMatch?.authorAvatar || 'default',
        };
      });
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

  // Real-time Firestore sync & Auto-seeding
  useEffect(() => {
    // 1. Articles Firestore listener
    const unsubArticles = onSnapshot(
      collection(db, 'articles'),
      (snap) => {
        if (!snap.empty) {
          const cloudArts = snap.docs.map((d) => d.data() as Article);
          setArticles(cloudArts);
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(cloudArts));
        } else {
          // Seed initial articles
          INITIAL_ARTICLES.forEach((art) => {
            safeSetDoc('articles', art.id, art);
          });
        }
      },
      (err) => {
        console.warn('Firestore articles listener info:', err.message);
      }
    );

    // 2. Announcements Firestore listener
    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        if (!snap.empty) {
          const cloudAnn = snap.docs.map((d) => d.data() as Announcement);
          setAnnouncements(cloudAnn);
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(cloudAnn));
        } else {
          INITIAL_ANNOUNCEMENTS.forEach((ann) => {
            safeSetDoc('announcements', ann.id, ann);
          });
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
        if (!snap.empty) {
          const cloudCats = snap.docs.map((d) => d.data() as PublicationCategory);
          const mergedCats = mergeAndOrderCategories(cloudCats);
          // Ensure any missing default publication menus are seeded to Firestore
          INITIAL_CATEGORIES.forEach((initCat) => {
            const existsInCloud = cloudCats.some(
              (c) =>
                c.id === initCat.id ||
                c.name.toLowerCase() === initCat.name.toLowerCase() ||
                (initCat.name === 'Announcements' && c.name.toLowerCase() === 'announcement')
            );
            if (!existsInCloud) {
              safeSetDoc('categories', initCat.id, initCat);
            }
          });
          setCategories(mergedCats);
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mergedCats));
        } else {
          INITIAL_CATEGORIES.forEach((cat) => {
            safeSetDoc('categories', cat.id, cat);
          });
        }
      },
      (err) => {
        console.warn('Firestore categories listener info:', err.message);
      }
    );

    // 4. Submissions Firestore listener
    const unsubSubmissions = onSnapshot(
      collection(db, 'submissions'),
      (snap) => {
        if (!snap.empty) {
          const cloudSubs = snap.docs.map((d) => d.data() as StorySubmission);
          setSubmissions(cloudSubs);
          localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(cloudSubs));
        } else {
          INITIAL_SUBMISSIONS.forEach((sub) => {
            setDoc(doc(db, 'submissions', sub.id), sub).catch(() => {});
          });
        }
      },
      (err) => {
        console.warn('Firestore submissions listener info:', err.message);
      }
    );

    // 5. Staff Firestore listener
    const unsubStaff = onSnapshot(
      collection(db, 'editorialStaff'),
      (snap) => {
        if (!snap.empty) {
          const cloudStaff = snap.docs.map((d) => d.data() as EditorialMember);
          setStaff(cloudStaff);
          localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(cloudStaff));
        } else {
          INITIAL_EDITORIAL_STAFF.forEach((member) => {
            setDoc(doc(db, 'editorialStaff', member.id), member).catch(() => {});
          });
        }
      },
      (err) => {
        console.warn('Firestore staff listener info:', err.message);
      }
    );

    // 6. Student Journalist Author Bio Profiles Firestore listener
    const unsubAuthorProfiles = onSnapshot(
      collection(db, 'authorProfiles'),
      (snap) => {
        if (!snap.empty) {
          const cloudProfiles = snap.docs.map((d) => d.data() as StudentAuthorProfile);
          setAuthorProfiles(cloudProfiles);
          localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILES, JSON.stringify(cloudProfiles));
        } else {
          INITIAL_AUTHOR_PROFILES.forEach((prof) => {
            safeSetDoc('authorProfiles', prof.id, prof);
          });
        }
      },
      (err) => {
        console.warn('Firestore authorProfiles listener info:', err.message);
      }
    );

    return () => {
      unsubArticles();
      unsubAnnouncements();
      unsubCategories();
      unsubSubmissions();
      unsubStaff();
      unsubAuthorProfiles();
    };
  }, []);

  // Save local preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn(e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED, JSON.stringify(likedArticles));
    } catch (e) {
      console.warn(e);
    }
  }, [likedArticles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(readingProgressMap));
    } catch (e) {
      console.warn(e);
    }
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
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === id) {
          const updatedArt = {
            ...art,
            likes: isLiked ? Math.max(0, art.likes - 1) : art.likes + 1,
          };
          setDoc(doc(db, 'articles', id), updatedArt).catch(() => {});
          return updatedArt;
        }
        return art;
      })
    );
  };

  // Increment view
  const incrementView = (id: string) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === id) {
          const updated = { ...art, views: art.views + 1 };
          setDoc(doc(db, 'articles', id), updated).catch(() => {});
          return updated;
        }
        return art;
      })
    );
  };

  // Student Submissions
  const addSubmission = (
    newSub: Omit<StorySubmission, 'id' | 'submittedAt' | 'status'>
  ): StorySubmission => {
    const created: StorySubmission = {
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
    };
    setSubmissions((prev) => [created, ...prev]);
    setDoc(doc(db, 'submissions', created.id), created).catch(() => {});
    return created;
  };

  const updateSubmissionStatus = (
    id: string,
    status: StorySubmission['status'],
    feedback?: string
  ) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const updated: StorySubmission = {
            ...sub,
            status,
            editorFeedback: feedback ?? sub.editorFeedback,
          };
          setDoc(doc(db, 'submissions', id), updated).catch(() => {});
          return updated;
        }
        return sub;
      })
    );
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

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: sub.headline,
      deck: sub.summary,
      category: sub.category,
      author: sub.studentName,
      authorRole: `${sub.gradeSection} (Student Contributor)`,
      authorBio: sub.notesToEditor || `Student journalist from ${sub.gradeSection} writing for The Inkspirer at Barobo National High School.`,
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
      pullQuote: paragraphs[0] ? `“${paragraphs[0].slice(0, 140)}...”` : undefined,
      categoryTheme,
      views: 1,
      likes: 0,
      issue: 'Vol. XXIV · Issue 1',
    };

    setArticles((prev) => [newArticle, ...prev]);
    setDoc(doc(db, 'articles', newArticle.id), newArticle).catch(() => {});

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
              const demoted = { ...item, leadStory: false };
              safeSetDoc('articles', item.id, demoted);
              return demoted;
            }
            return item;
          }),
        ];
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updated));
        return updated;
      });
    } else {
      setArticles((prev) => {
        const updated = [newArt, ...prev];
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updated));
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
          const demoted = { ...item, leadStory: false };
          safeSetDoc('articles', item.id, demoted);
          return demoted;
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(nextList));
      return nextList;
    });
  };

  const deleteArticle = (id: string) => {
    setArticles((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(remaining));
      return remaining;
    });
    deleteDoc(doc(db, 'articles', id)).catch(() => {});
  };

  // Announcements management
  const addAnnouncement = (ann: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = stripUndefined({
      ...ann,
      id: `ann-${Date.now()}`,
      title: ann.title.trim(),
      content: ann.content.trim(),
      ...(ann.deadline?.trim() ? { deadline: ann.deadline.trim() } : { deadline: undefined }),
      ...(ann.location?.trim() ? { location: ann.location.trim() } : { location: undefined }),
    });
    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(remaining));
      return remaining;
    });
    deleteDoc(doc(db, 'announcements', id)).catch(() => {});
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
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Category Management CRUD
  const addCategory = (cat: Omit<PublicationCategory, 'id' | 'slug'>): PublicationCategory => {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const newCategory: PublicationCategory = stripUndefined({
      ...cat,
      id: `cat-${Date.now()}`,
      slug,
      isDefault: false,
    });
    setCategories((prev) => {
      const updated = [...prev, newCategory];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(nextCats));
      return nextCats;
    });
    safeSetDoc('categories', id, merged);

    // If category name or colors changed, update existing articles in state and Firestore
    if (oldName !== newName || updated.color || updated.badgeBg || updated.badgeText) {
      setArticles((prev) =>
        prev.map((art) => {
          if (art.category.toLowerCase() === oldName.toLowerCase()) {
            const updArt: Article = {
              ...art,
              category: newName,
              categoryTheme: {
                accentColor: updated.color || art.categoryTheme.accentColor,
                badgeBg: updated.badgeBg || art.categoryTheme.badgeBg,
                badgeText: updated.badgeText || art.categoryTheme.badgeText,
              },
            };
            setDoc(doc(db, 'articles', art.id), updArt).catch(() => {});
            return updArt;
          }
          return art;
        })
      );

      // Also cascade to submissions
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.category.toLowerCase() === oldName.toLowerCase()) {
            const updSub = { ...sub, category: newName };
            setDoc(doc(db, 'submissions', sub.id), updSub).catch(() => {});
            return updSub;
          }
          return sub;
        })
      );
    }
  };

  const deleteCategory = (id: string, fallbackCategoryName?: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const remaining = categories.filter((c) => c.id !== id);
    const replacement = fallbackCategoryName || remaining[0]?.name || 'News';

    setCategories(remaining);
    deleteDoc(doc(db, 'categories', id)).catch(() => {});

    // Reassign articles under deleted category to replacement
    setArticles((prev) =>
      prev.map((art) => {
        if (art.category.toLowerCase() === target.name.toLowerCase()) {
          const repCat = remaining.find((c) => c.name.toLowerCase() === replacement.toLowerCase());
          const updArt: Article = {
            ...art,
            category: replacement,
            categoryTheme: repCat
              ? { accentColor: repCat.color, badgeBg: repCat.badgeBg, badgeText: repCat.badgeText }
              : art.categoryTheme,
          };
          setDoc(doc(db, 'articles', art.id), updArt).catch(() => {});
          return updArt;
        }
        return art;
      })
    );

    // Reassign submissions
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.category.toLowerCase() === target.name.toLowerCase()) {
          const updSub = { ...sub, category: replacement };
          setDoc(doc(db, 'submissions', sub.id), updSub).catch(() => {});
          return updSub;
        }
        return sub;
      })
    );
  };

  // Editorial Board & Masthead Roster CRUD
  const addStaffMember = (memberData: Omit<EditorialMember, 'id' | 'avatarSeed'>): EditorialMember => {
    const cleanName = memberData.name.trim();
    const newMember: EditorialMember = {
      id: `staff-${Date.now()}`,
      name: cleanName,
      role: memberData.role.trim(),
      gradeOrDesignation: memberData.gradeOrDesignation.trim(),
      department: memberData.department.trim(),
      avatarSeed: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'member',
      ...(memberData.photoUrl ? { photoUrl: memberData.photoUrl } : {}),
    };

    setStaff((prev) => {
      const updated = [...prev, newMember];
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
      return updated;
    });

    setDoc(doc(db, 'editorialStaff', newMember.id), newMember).catch((err) => {
      console.warn('Firestore addStaffMember sync warning:', err);
    });

    return newMember;
  };

  const updateStaffMember = (id: string, updatedFields: Partial<EditorialMember>) => {
    setStaff((prev) => {
      const updatedList = prev.map((member) => {
        if (member.id !== id) return member;
        const merged: EditorialMember = {
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
        if (!merged.photoUrl) {
          delete merged.photoUrl;
        }
        setDoc(doc(db, 'editorialStaff', id), merged).catch((err) => {
          console.warn('Firestore updateStaffMember sync warning:', err);
        });
        return merged;
      });
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const deleteStaffMember = (id: string) => {
    setStaff((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(remaining));
      return remaining;
    });
    deleteDoc(doc(db, 'editorialStaff', id)).catch((err) => {
      console.warn('Firestore deleteStaffMember sync warning:', err);
    });
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
      localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILES, JSON.stringify(updated));
      return updated;
    });

    safeSetDoc('authorProfiles', newProfile.id, newProfile);

    // Sync matching articles by author name
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
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(synced));
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
    let finalMergedProfile: StudentAuthorProfile | null = null;

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
        finalMergedProfile = merged;
        safeSetDoc('authorProfiles', id, merged);
        return merged;
      });
      localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILES, JSON.stringify(updatedList));
      return updatedList;
    });

    // Cascade bio and role updates to all articles authored by this student journalist
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
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(synced));
      return synced;
    });
  };

  const deleteAuthorProfile = (id: string) => {
    setAuthorProfiles((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.AUTHOR_PROFILES, JSON.stringify(remaining));
      return remaining;
    });
    deleteDoc(doc(db, 'authorProfiles', id)).catch((err) => {
      console.warn('Firestore deleteAuthorProfile sync warning:', err);
    });
  };

  // Reset to factory demo data in state & Firestore
  const resetToDefaults = () => {
    setArticles(INITIAL_ARTICLES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setStaff(INITIAL_EDITORIAL_STAFF);
    setCategories(INITIAL_CATEGORIES);
    setAuthorProfiles(INITIAL_AUTHOR_PROFILES);
    setBookmarks([]);
    setLikedArticles([]);
    setReadingProgressMap({});
    localStorage.clear();

    INITIAL_ARTICLES.forEach((art) => {
      setDoc(doc(db, 'articles', art.id), art).catch(() => {});
    });
    INITIAL_ANNOUNCEMENTS.forEach((ann) => {
      setDoc(doc(db, 'announcements', ann.id), ann).catch(() => {});
    });
    INITIAL_CATEGORIES.forEach((cat) => {
      setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
    });
    INITIAL_SUBMISSIONS.forEach((sub) => {
      setDoc(doc(db, 'submissions', sub.id), sub).catch(() => {});
    });
    INITIAL_EDITORIAL_STAFF.forEach((member) => {
      setDoc(doc(db, 'editorialStaff', member.id), member).catch(() => {});
    });
    INITIAL_AUTHOR_PROFILES.forEach((prof) => {
      safeSetDoc('authorProfiles', prof.id, prof);
    });
  };

  return {
    articles,
    announcements,
    submissions,
    staff,
    categories,
    authorProfiles,
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
    resetToDefaults,
  };
}
