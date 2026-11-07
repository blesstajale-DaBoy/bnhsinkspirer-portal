import React from 'react';

/**
 * Extracts a Google Drive File ID from any common Google Drive sharing or direct link format.
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();

  const isGoogleDriveDomain =
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('drive.usercontent.google.com') ||
    trimmed.includes('lh3.googleusercontent.com/d/');

  if (!isGoogleDriveDomain) return null;

  // Format 1: /file/d/{FILE_ID}/view or /file/d/{FILE_ID}/edit or /file/d/{FILE_ID}/preview
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Format 2: /d/{FILE_ID} (e.g. lh3.googleusercontent.com/d/{FILE_ID})
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Format 3: ?id={FILE_ID} or &id={FILE_ID} (e.g. open?id=, uc?id=, thumbnail?id=, download?id=)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
}

/**
 * Converts Google Drive sharing links, Dropbox links, GitHub blob links,
 * or pasted HTML <img> snippets into direct displayable image URLs.
 */
export function normalizeImageUrl(input?: string | null): string {
  if (!input) return '';
  let url = input.trim();
  if (!url) return '';

  // Keep data:image/* or blob: URLs intact
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }

  // If user pasted an HTML <img src="..."> or <iframe src="..."> snippet, extract src
  if (url.startsWith('<') && url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1].trim();
    }
  }

  // Check if it is a Google Drive URL
  const driveFileId = extractGoogleDriveFileId(url);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`;
  }

  // Convert Dropbox share links (?dl=0 -> ?raw=1)
  if (url.includes('dropbox.com')) {
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'raw=1');
    }
    if (!url.includes('raw=1') && !url.includes('dl=1')) {
      return url + (url.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  // Convert GitHub blob URLs to raw.githubusercontent.com
  if (url.includes('github.com/') && url.includes('/blob/')) {
    return url
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/blob/', '/');
  }

  return url;
}

/**
 * Automatic onError fallback handler for <img> elements displaying Google Drive images.
 * Cycles through alternative Google Drive direct image endpoints if one is blocked by browser policies.
 */
export function handleImageErrorWithDriveFallback(
  e: React.SyntheticEvent<HTMLImageElement, Event>
): void {
  const img = e.currentTarget;
  const currentSrc = img.getAttribute('src') || '';
  const fileId = extractGoogleDriveFileId(currentSrc);
  if (!fileId) return;

  const retryStep = parseInt(img.getAttribute('data-drive-retry') || '0', 10);

  if (retryStep === 0) {
    img.setAttribute('data-drive-retry', '1');
    img.src = `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
  } else if (retryStep === 1) {
    img.setAttribute('data-drive-retry', '2');
    img.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
  } else if (retryStep === 2) {
    img.setAttribute('data-drive-retry', '3');
    img.src = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
  }
}
