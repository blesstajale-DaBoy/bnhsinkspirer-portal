import { extractGoogleDriveFileId } from './imageUrl';

export type ParsedVideoType = 'youtube' | 'gdrive' | 'direct';

export interface ParsedVideoMedia {
  type: ParsedVideoType;
  rawUrl: string;
  embedUrl?: string;
  mutedEmbedUrl?: string;
  unmutedEmbedUrl?: string;
  directUrl?: string;
  label: string;
}

/**
 * Extracts a YouTube 11-character video ID from standard watch, youtu.be, shorts, live, or embed URLs.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();

  // Matches youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtube.com/live/ID
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Normalizes a pasted video URL (YouTube, Google Drive video link, Dropbox video link,
 * or direct .mp4/.webm/.ogg/.mov URL, or pasted <iframe src="..."> snippet)
 * into structured playback metadata for the 1000x500 slideshow and preview.
 */
export function parseVideoUrl(input?: string | null): ParsedVideoMedia | null {
  if (!input) return null;
  let url = input.trim();
  if (!url) return null;

  // If user pasted an HTML <iframe src="..."> or <video src="..."> snippet, extract src
  if (url.startsWith('<') && url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1].trim();
    }
  }

  // 1. YouTube
  const ytId = extractYouTubeVideoId(url);
  if (ytId) {
    const base = `https://www.youtube.com/embed/${ytId}`;
    const commonParams = `autoplay=1&loop=1&playlist=${ytId}&rel=0&modestbranding=1&playsinline=1&controls=1`;
    return {
      type: 'youtube',
      rawUrl: url,
      embedUrl: `${base}?${commonParams}&mute=1`,
      mutedEmbedUrl: `${base}?${commonParams}&mute=1`,
      unmutedEmbedUrl: `${base}?${commonParams}&mute=0`,
      label: 'YouTube Video',
    };
  }

  // 2. Google Drive Video
  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    return {
      type: 'gdrive',
      rawUrl: url,
      embedUrl: previewUrl,
      mutedEmbedUrl: previewUrl,
      unmutedEmbedUrl: previewUrl,
      label: 'Google Drive Video',
    };
  }

  // 3. Direct Video URLs (.mp4, .webm, .ogg, .mov, .m4v, Dropbox raw video, or data:video/)
  let directUrl = url;
  if (directUrl.includes('dropbox.com')) {
    if (directUrl.includes('dl=0')) {
      directUrl = directUrl.replace('dl=0', 'raw=1');
    } else if (!directUrl.includes('raw=1') && !directUrl.includes('dl=1')) {
      directUrl = directUrl + (directUrl.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  const isDirectVideo =
    directUrl.startsWith('data:video/') ||
    directUrl.startsWith('blob:') ||
    /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(directUrl) ||
    directUrl.includes('dropbox.com');

  if (isDirectVideo || /^https?:\/\//i.test(directUrl)) {
    return {
      type: 'direct',
      rawUrl: url,
      directUrl,
      label: 'Direct Video (.mp4 / Stream)',
    };
  }

  return null;
}
