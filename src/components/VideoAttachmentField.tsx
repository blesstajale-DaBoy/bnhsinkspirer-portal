import React, { useState } from 'react';
import {
  Film,
  Upload,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  parseVideoUrl,
  isDirectPlaybackType,
  getSampleVideoForCategory,
} from '../utils/videoUrl';
import {
  saveLocalVideoFile,
  useResolvedVideoUrl,
  isLocalVideoUri,
} from '../utils/localVideoStore';

interface VideoAttachmentFieldProps {
  value: string;
  onChange: (nextUrl: string) => void;
  category?: string;
  label?: string;
  compact?: boolean;
  previewAspectClass?: string;
  onStatusMessage?: (msg: string) => void;
}

export const VideoAttachmentField: React.FC<VideoAttachmentFieldProps> = ({
  value,
  onChange,
  category = 'News',
  label = 'Attach Story Video (Local File, Google Drive, YouTube, or Any Link)',
  compact = false,
  previewAspectClass = 'aspect-[2/1] max-h-56',
  onStatusMessage,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadNote, setUploadNote] = useState('');

  const { resolvedUrl, isResolving, isMissingLocal } = useResolvedVideoUrl(value);
  const parsedPreview = parseVideoUrl(resolvedUrl || value);
  const sampleVideo = getSampleVideoForCategory(category);

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same file works
    e.target.value = '';
    if (!file) return;

    setUploadError('');
    setUploadNote('');
    setIsUploading(true);

    try {
      const saved = await saveLocalVideoFile(file);
      onChange(saved.url);
      const note =
        saved.storedIn === 'inline'
          ? `Uploaded "${saved.fileName}" (${saved.sizeMb} MB) — ready for Preview & Live sync.`
          : `Uploaded "${saved.fileName}" (${saved.sizeMb} MB) to local browser storage for smooth HD playback.`;
      setUploadNote(note);
      onStatusMessage?.(note);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to upload local video file.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = () => {
    setUploadError('');
    setUploadNote(`Loaded ${sampleVideo.category} example video (${sampleVideo.title}).`);
    onChange(sampleVideo.url);
    onStatusMessage?.(`Loaded ${sampleVideo.category} sample video!`);
  };

  return (
    <div className={compact ? 'space-y-2.5' : 'border border-stone-200 bg-[#FBF9F5] p-4 rounded-lg space-y-3'}>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#4A0E17]" />
            <span>{label}</span>
          </label>
          <span className="text-[11px] text-stone-500">
            Plays automatically in the 1000 × 500 slideshow & reader
          </span>
        </div>
      )}

      {/* Upload Local Video + Paste Any Link Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-[#4A0E17] text-[#F3C562] font-semibold text-xs hover:bg-[#5C1521] transition-colors cursor-pointer shrink-0">
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>{isUploading ? 'Saving Video...' : 'Upload Local Video'}</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
            onChange={handleLocalFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        <div className="relative flex-1">
          <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={isLocalVideoUri(value) || value.startsWith('data:video/') ? '' : value}
            onChange={(e) => {
              setUploadError('');
              setUploadNote('');
              onChange(e.target.value);
            }}
            placeholder={
              isLocalVideoUri(value) || value.startsWith('data:video/')
                ? 'Local video uploaded (or paste a link here to replace)...'
                : 'Paste Google Drive, YouTube, Vimeo, Facebook, TikTok, .mp4, or any link...'
            }
            className="w-full pl-8 pr-16 py-2 rounded border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#4A0E17] focus:border-[#4A0E17]"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setUploadError('');
                setUploadNote('');
                onChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 px-1.5 py-0.5 rounded bg-rose-50 cursor-pointer"
              title="Remove video"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Example Video + Supported Formats Helper */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
        <p className="leading-relaxed">
          Supports <strong>Local Upload</strong> (.mp4, .webm, .mov up to 50 MB),{' '}
          <strong>Google Drive</strong>, <strong>YouTube</strong>, <strong>Vimeo</strong>,{' '}
          <strong>Facebook</strong>, <strong>TikTok</strong>, <strong>Dropbox</strong>, or{' '}
          <strong>any video link / embed</strong>.
        </p>
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold text-[11px] transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-700" />
          <span>Use {sampleVideo.category} Example Video</span>
        </button>
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadNote && !uploadError && (
        <div className="flex items-start gap-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{uploadNote}</span>
        </div>
      )}

      {/* Live Video Preview */}
      {value && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                Detected: {parsedPreview?.label || 'Video Attached'}
              </span>
            </span>
            <span className="text-stone-500">Live Video Preview</span>
          </div>

          <div
            className={`rounded-lg overflow-hidden border border-stone-300 bg-black relative w-full ${previewAspectClass}`}
          >
            {isResolving ? (
              <div className="w-full h-full flex items-center justify-center gap-2 text-stone-300 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#F3C562]" />
                <span>Loading local video preview...</span>
              </div>
            ) : isMissingLocal ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-stone-300 text-xs gap-1">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Local video was saved on another device/browser. Upload again or paste a Google Drive / YouTube link.</span>
              </div>
            ) : parsedPreview && isDirectPlaybackType(parsedPreview.type) && (resolvedUrl || parsedPreview.directUrl) ? (
              <video
                key={resolvedUrl || parsedPreview.directUrl}
                src={resolvedUrl || parsedPreview.directUrl}
                controls
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : parsedPreview?.embedUrl ? (
              <iframe
                key={parsedPreview.mutedEmbedUrl || parsedPreview.embedUrl}
                src={parsedPreview.mutedEmbedUrl || parsedPreview.embedUrl}
                title="Video Preview"
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
