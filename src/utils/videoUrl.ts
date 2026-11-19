import { extractGoogleDriveFileId } from './imageUrl';
import { isLocalVideoUri } from './localVideoStore';

export type ParsedVideoType =
  | 'local'
  | 'youtube'
  | 'gdrive'
  | 'vimeo'
  | 'facebook'
  | 'tiktok'
  | 'dailymotion'
  | 'streamable'
  | 'loom'
  | 'canva'
  | 'direct'
  | 'embed';

export interface ParsedVideoMedia {
  type: ParsedVideoType;
  rawUrl: string;
  embedUrl?: string;
  mutedEmbedUrl?: string;
  unmutedEmbedUrl?: string;
  directUrl?: string;
  supportsMuteToggle?: boolean;
  label: string;
}

export interface SampleCategoryVideo {
  category: 'News' | 'Features' | 'Opinion' | 'Sports';
  articleId: string;
  title: string;
  url: string;
  sourceLabel: string;
}

/**
 * Curated HD example videos for each core section (News, Features, Opinion, Sports)
 * so every category showcases working video playback in the 1000x500 slider and reader.
 */
export const SAMPLE_CATEGORY_VIDEOS: Record<
  'News' | 'Features' | 'Opinion' | 'Sports',
  SampleCategoryVideo
> = {
  News: {
    category: 'News',
    articleId: 'art-1',
    title: 'News Spotlight Sample Video (HD .mp4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sourceLabel: 'News Sample Video',
  },
  Features: {
    category: 'Features',
    articleId: 'art-2',
    title: 'Features Documentary Sample Video (HD .mp4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    sourceLabel: 'Features Sample Video',
  },
  Opinion: {
    category: 'Opinion',
    articleId: 'art-3',
    title: 'Opinion & Editorial Commentary Sample Video (HD .mp4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    sourceLabel: 'Opinion Sample Video',
  },
  Sports: {
    category: 'Sports',
    articleId: 'art-4',
    title: 'Sports Highlights Sample Video (HD .mp4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    sourceLabel: 'Sports Sample Video',
  },
};

export const DEFAULT_SAMPLE_ARTICLE_VIDEOS: Record<string, string> = {
  'art-1': SAMPLE_CATEGORY_VIDEOS.News.url,
  'art-2': SAMPLE_CATEGORY_VIDEOS.Features.url,
  'art-3': SAMPLE_CATEGORY_VIDEOS.Opinion.url,
  'art-4': SAMPLE_CATEGORY_VIDEOS.Sports.url,
};

export function getSampleVideoForCategory(category?: string): SampleCategoryVideo {
  const lower = (category || '').trim().toLowerCase();
  if (lower === 'features') return SAMPLE_CATEGORY_VIDEOS.Features;
  if (lower === 'opinion') return SAMPLE_CATEGORY_VIDEOS.Opinion;
  if (lower === 'sports') return SAMPLE_CATEGORY_VIDEOS.Sports;
  return SAMPLE_CATEGORY_VIDEOS.News;
}

/**
 * Extracts a YouTube 11-character video ID from standard watch, youtu.be, shorts, live, or embed URLs.
 */
export function extractYouTubeVideoId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();

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

function extractVimeoVideoId(rawUrl: string): string | null {
  const match = rawUrl.match(/(?:vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  return match && match[1] ? match[1] : null;
}

function extractDailymotionVideoId(rawUrl: string): string | null {
  const match = rawUrl.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  return match && match[1] ? match[1] : null;
}

function extractStreamableId(rawUrl: string): string | null {
  const match = rawUrl.match(/streamable\.com\/(?:e\/|o\/)?([a-zA-Z0-9]+)/i);
  return match && match[1] ? match[1] : null;
}

function extractLoomId(rawUrl: string): string | null {
  const match = rawUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  return match && match[1] ? match[1] : null;
}

function extractTikTokVideoId(rawUrl: string): string | null {
  const match = rawUrl.match(/tiktok\.com\/(?:@[^/]+\/video\/|embed\/v2\/)(\d+)/i);
  return match && match[1] ? match[1] : null;
}

function isFacebookVideoUrl(rawUrl: string): boolean {
  return /(?:facebook\.com\/(?:watch|.*\/videos\/|reel\/|share\/v\/)|fb\.watch\/)/i.test(rawUrl);
}

/**
 * Normalizes any video source:
 * - Local uploaded videos (IndexedDB `local-video://`, `data:video/`, `blob:`)
 * - YouTube (watch, shorts, live, youtu.be, embed)
 * - Google Drive / Google links
 * - Vimeo, Facebook Video/Reels, TikTok, Dailymotion, Streamable, Loom, Canva
 * - Dropbox raw video links & direct `.mp4` / `.webm` / `.ogg` / `.mov` / `.m4v` streams
 * - Pasted `<iframe src="...">` / `<video src="...">` snippets or any web video URL
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

  // 1. Local uploaded video (IndexedDB URI, data:video/, or blob:)
  if (isLocalVideoUri(url) || url.startsWith('data:video/') || url.startsWith('blob:')) {
    return {
      type: 'local',
      rawUrl: url,
      directUrl: url,
      supportsMuteToggle: true,
      label: 'Uploaded Local Video',
    };
  }

  // 2. YouTube
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
      supportsMuteToggle: true,
      label: 'YouTube Video',
    };
  }

  // 3. Google Drive Video
  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    return {
      type: 'gdrive',
      rawUrl: url,
      embedUrl: previewUrl,
      mutedEmbedUrl: previewUrl,
      unmutedEmbedUrl: previewUrl,
      supportsMuteToggle: false,
      label: 'Google Drive Video',
    };
  }

  // 4. Vimeo
  const vimeoId = extractVimeoVideoId(url);
  if (vimeoId) {
    const base = `https://player.vimeo.com/video/${vimeoId}`;
    return {
      type: 'vimeo',
      rawUrl: url,
      embedUrl: `${base}?autoplay=1&loop=1&muted=1`,
      mutedEmbedUrl: `${base}?autoplay=1&loop=1&muted=1`,
      unmutedEmbedUrl: `${base}?autoplay=1&loop=1&muted=0`,
      supportsMuteToggle: true,
      label: 'Vimeo Video',
    };
  }

  // 5. Facebook Video / Reel / Watch
  if (isFacebookVideoUrl(url)) {
    const fbEmbed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url
    )}&show_text=false&autoplay=true`;
    return {
      type: 'facebook',
      rawUrl: url,
      embedUrl: fbEmbed,
      mutedEmbedUrl: fbEmbed,
      unmutedEmbedUrl: fbEmbed,
      supportsMuteToggle: false,
      label: 'Facebook Video',
    };
  }

  // 6. TikTok
  const tiktokId = extractTikTokVideoId(url);
  if (tiktokId) {
    const ttEmbed = `https://www.tiktok.com/embed/v2/${tiktokId}`;
    return {
      type: 'tiktok',
      rawUrl: url,
      embedUrl: ttEmbed,
      mutedEmbedUrl: ttEmbed,
      unmutedEmbedUrl: ttEmbed,
      supportsMuteToggle: false,
      label: 'TikTok Video',
    };
  }

  // 7. Dailymotion
  const dmId = extractDailymotionVideoId(url);
  if (dmId) {
    const dmEmbed = `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1&mute=1`;
    return {
      type: 'dailymotion',
      rawUrl: url,
      embedUrl: dmEmbed,
      mutedEmbedUrl: dmEmbed,
      unmutedEmbedUrl: `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1&mute=0`,
      supportsMuteToggle: true,
      label: 'Dailymotion Video',
    };
  }

  // 8. Streamable
  const streamableId = extractStreamableId(url);
  if (streamableId) {
    const stEmbed = `https://streamable.com/e/${streamableId}?autoplay=1&muted=1`;
    return {
      type: 'streamable',
      rawUrl: url,
      embedUrl: stEmbed,
      mutedEmbedUrl: stEmbed,
      unmutedEmbedUrl: `https://streamable.com/e/${streamableId}?autoplay=1&muted=0`,
      supportsMuteToggle: true,
      label: 'Streamable Video',
    };
  }

  // 9. Loom
  const loomId = extractLoomId(url);
  if (loomId) {
    const loomEmbed = `https://www.loom.com/embed/${loomId}`;
    return {
      type: 'loom',
      rawUrl: url,
      embedUrl: loomEmbed,
      mutedEmbedUrl: loomEmbed,
      unmutedEmbedUrl: loomEmbed,
      supportsMuteToggle: false,
      label: 'Loom Video',
    };
  }

  // 10. Canva Video / Presentation
  if (/canva\.com\/design\//i.test(url)) {
    const canvaEmbed = url.includes('embed')
      ? url
      : `${url.split('?')[0].replace(/\/(edit|view)$/i, '/view')}?embed`;
    return {
      type: 'canva',
      rawUrl: url,
      embedUrl: canvaEmbed,
      mutedEmbedUrl: canvaEmbed,
      unmutedEmbedUrl: canvaEmbed,
      supportsMuteToggle: false,
      label: 'Canva Video',
    };
  }

  // 11. Direct Video URLs (.mp4, .webm, .ogg, .mov, .m4v, Dropbox raw video, Google Storage)
  let directUrl = url;
  if (directUrl.includes('dropbox.com')) {
    if (directUrl.includes('dl=0')) {
      directUrl = directUrl.replace('dl=0', 'raw=1');
    } else if (!directUrl.includes('raw=1') && !directUrl.includes('dl=1')) {
      directUrl = directUrl + (directUrl.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  const isDirectVideo =
    /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(directUrl) ||
    directUrl.includes('dropbox.com') ||
    directUrl.includes('commondatastorage.googleapis.com');

  if (isDirectVideo) {
    return {
      type: 'direct',
      rawUrl: url,
      directUrl,
      supportsMuteToggle: true,
      label: 'Direct Video (.mp4 / Stream)',
    };
  }

  // 12. Any other web video link or embed URL
  if (/^https?:\/\//i.test(url)) {
    return {
      type: 'embed',
      rawUrl: url,
      embedUrl: url,
      mutedEmbedUrl: url,
      unmutedEmbedUrl: url,
      supportsMuteToggle: false,
      label: 'Web Video Link',
    };
  }

  return null;
}

export function isDirectPlaybackType(type: ParsedVideoType): boolean {
  return type === 'direct' || type === 'local';
}
