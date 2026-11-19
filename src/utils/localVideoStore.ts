import { useState, useEffect } from 'react';

const DB_NAME = 'the_inkspirer_local_videos_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const LOCAL_VIDEO_PREFIX = 'local-video://';

// Videos <= 450 KB can be stored inline as data:video/ URLs so they also sync to Firestore.
// Larger videos (up to 50 MB) are persisted in IndexedDB and served via cached blob: URLs.
const MAX_INLINE_VIDEO_BYTES = 450 * 1024;
export const MAX_LOCAL_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

interface StoredLocalVideoRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

const blobUrlCache = new Map<string, string>();

export function isLocalVideoUri(url?: string | null): boolean {
  return typeof url === 'string' && url.trim().startsWith(LOCAL_VIDEO_PREFIX);
}

export function extractLocalVideoId(url: string): string {
  return url.trim().slice(LOCAL_VIDEO_PREFIX.length);
}

function openVideoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Failed to open local video storage.'));
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read local video file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read local video file.'));
    reader.readAsDataURL(file);
  });
}

export interface SaveLocalVideoResult {
  url: string;
  storedIn: 'inline' | 'indexeddb';
  fileName: string;
  sizeMb: number;
}

/**
 * Saves an uploaded local video file.
 * - Small files (<= 450 KB) are returned as a `data:video/...` URI.
 * - Larger files (up to 50 MB) are persisted in IndexedDB and returned as `local-video://vid-...`.
 */
export async function saveLocalVideoFile(file: File): Promise<SaveLocalVideoResult> {
  if (!file.type.startsWith('video/') && !/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file.name)) {
    throw new Error('Please choose a valid video file (.mp4, .webm, .ogg, .mov, or .m4v).');
  }

  if (file.size > MAX_LOCAL_VIDEO_BYTES) {
    const maxMb = Math.round(MAX_LOCAL_VIDEO_BYTES / (1024 * 1024));
    throw new Error(
      `Video file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum local upload size is ${maxMb} MB. For larger videos, upload to Google Drive or YouTube and paste the link.`
    );
  }

  const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));

  if (file.size <= MAX_INLINE_VIDEO_BYTES) {
    const dataUrl = await fileToDataUrl(file);
    return {
      url: dataUrl,
      storedIn: 'inline',
      fileName: file.name,
      sizeMb,
    };
  }

  const id = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const uri = `${LOCAL_VIDEO_PREFIX}${id}`;

  const db = await openVideoDatabase();
  const record: StoredLocalVideoRecord = {
    id,
    name: file.name,
    mimeType: file.type || 'video/mp4',
    size: file.size,
    blob: file,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to save video in local browser storage.'));
  });

  const objectUrl = URL.createObjectURL(file);
  blobUrlCache.set(uri, objectUrl);

  return {
    url: uri,
    storedIn: 'indexeddb',
    fileName: file.name,
    sizeMb,
  };
}

/**
 * Resolves a `local-video://...` URI into a playable browser `blob:` URL.
 * Non-local URLs are returned as-is.
 */
export async function resolveLocalVideoUrl(rawUrl?: string | null): Promise<string | null> {
  if (!rawUrl || !rawUrl.trim()) return null;
  const trimmed = rawUrl.trim();

  if (!isLocalVideoUri(trimmed)) {
    return trimmed;
  }

  const cached = blobUrlCache.get(trimmed);
  if (cached) {
    return cached;
  }

  try {
    const id = extractLocalVideoId(trimmed);
    const db = await openVideoDatabase();
    const record = await new Promise<StoredLocalVideoRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as StoredLocalVideoRecord | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!record || !record.blob) {
      return null;
    }

    const objectUrl = URL.createObjectURL(record.blob);
    blobUrlCache.set(trimmed, objectUrl);
    return objectUrl;
  } catch (err) {
    console.warn('Unable to resolve local video from IndexedDB:', err);
    return null;
  }
}

export interface ResolvedVideoState {
  resolvedUrl: string | null;
  isResolving: boolean;
  isMissingLocal: boolean;
}

/**
 * React hook that asynchronously resolves `local-video://` URIs from IndexedDB
 * while passing standard web URLs (YouTube, Google Drive, .mp4, etc.) through immediately.
 */
export function useResolvedVideoUrl(rawUrl?: string | null): ResolvedVideoState {
  const trimmed = rawUrl?.trim() || '';
  const isLocal = isLocalVideoUri(trimmed);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (!trimmed) return null;
    if (!isLocal) return trimmed;
    return blobUrlCache.get(trimmed) || null;
  });
  const [isResolving, setIsResolving] = useState<boolean>(() => {
    return isLocal && !blobUrlCache.has(trimmed);
  });
  const [isMissingLocal, setIsMissingLocal] = useState<boolean>(false);

  useEffect(() => {
    if (!trimmed) {
      setResolvedUrl(null);
      setIsResolving(false);
      setIsMissingLocal(false);
      return;
    }

    if (!isLocal) {
      setResolvedUrl(trimmed);
      setIsResolving(false);
      setIsMissingLocal(false);
      return;
    }

    const cached = blobUrlCache.get(trimmed);
    if (cached) {
      setResolvedUrl(cached);
      setIsResolving(false);
      setIsMissingLocal(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    setIsMissingLocal(false);

    resolveLocalVideoUrl(trimmed).then((url) => {
      if (cancelled) return;
      setResolvedUrl(url);
      setIsResolving(false);
      setIsMissingLocal(!url);
    });

    return () => {
      cancelled = true;
    };
  }, [trimmed, isLocal]);

  return { resolvedUrl, isResolving, isMissingLocal };
}
