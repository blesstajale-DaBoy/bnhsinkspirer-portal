import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Film,
} from 'lucide-react';
import { Article, PublicationCategory } from '../types';
import { normalizeImageUrl, handleImageErrorWithDriveFallback } from '../utils/imageUrl';
import {
  parseVideoUrl,
  ParsedVideoMedia,
  isDirectPlaybackType,
} from '../utils/videoUrl';
import { useResolvedVideoUrl } from '../utils/localVideoStore';
import { EditorialArtwork } from './EditorialArtwork';

interface CategoryStorySliderProps {
  articles: Article[];
  categories: PublicationCategory[];
  onSelectArticle: (article: Article) => void;
}

const SLIDE_INTERVAL_MS = 20000; // 20 seconds as requested
const TIMER_TICK_MS = 100; // Smooth 10fps progress bar updates

const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  news: { bg: '#FB923C', text: '#2D1204', border: '#FDBA74' },
  features: { bg: '#38BDF8', text: '#06202E', border: '#7DD3FC' },
  opinion: { bg: '#D4AF37', text: '#2A1B02', border: '#F3C562' },
  sports: { bg: '#FACC15', text: '#2E2002', border: '#FEF08A' },
  announcements: { bg: '#C084FC', text: '#220738', border: '#E9D5FF' },
};

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  news: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
  features: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  opinion: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
};

export const CategoryStorySlider: React.FC<CategoryStorySliderProps> = ({
  articles,
  categories,
  onSelectArticle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedMsRef = useRef(0);

  // Build ordered slides from articles across NEWS, FEATURES, OPINION, SPORTS (and any custom categories)
  // Interleaves the top story of News, Features, Opinion, Sports first (prioritizing posts with uploaded videos or photos),
  // followed by any remaining posts so every category and uploaded story media is showcased.
  const slides = useMemo(() => {
    if (!articles || articles.length === 0) return [];

    const coreCategoryOrder = ['News', 'Features', 'Opinion', 'Sports'];
    const dynamicCatNames = categories
      .map((c) => c.name)
      .filter(
        (name) =>
          name.toLowerCase() !== 'announcements' &&
          !coreCategoryOrder.some((core) => core.toLowerCase() === name.toLowerCase())
      );
    const orderedCategories = [...coreCategoryOrder, ...dynamicCatNames];

    // Sort helper: prioritize articles that have an explicit uploaded videoUrl or imageUrl
    const sortWithUploadedFirst = (list: Article[]) => {
      return [...list].sort((a, b) => {
        const aHasMedia = Boolean((a.videoUrl && a.videoUrl.trim()) || (a.imageUrl && a.imageUrl.trim()));
        const bHasMedia = Boolean((b.videoUrl && b.videoUrl.trim()) || (b.imageUrl && b.imageUrl.trim()));
        if (aHasMedia && !bHasMedia) return -1;
        if (!aHasMedia && bHasMedia) return 1;
        return 0;
      });
    };

    const usedIds = new Set<string>();
    const result: {
      article: Article;
      resolvedImageUrl: string;
      parsedVideo: ParsedVideoMedia | null;
      categoryColor: string;
    }[] = [];

    const getCategoryMeta = (catName: string) => {
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );
      const lower = catName.toLowerCase();
      const fallbackImg = FALLBACK_CATEGORY_IMAGES[lower] || '';
      const catImg = normalizeImageUrl(matchedCat?.imageUrl) || fallbackImg;
      const color =
        matchedCat?.color ||
        CATEGORY_BADGE_COLORS[lower]?.bg ||
        '#D4AF37';
      return { catImg, color };
    };

    // Pass 1: First representative post from each category (News, Features, Opinion, Sports, etc.)
    orderedCategories.forEach((catName) => {
      const matchingArticles = sortWithUploadedFirst(
        articles.filter((a) => a.category.toLowerCase() === catName.toLowerCase())
      );
      if (matchingArticles.length > 0) {
        const topArt = matchingArticles[0];
        usedIds.add(topArt.id);
        const { catImg, color } = getCategoryMeta(topArt.category);
        result.push({
          article: topArt,
          resolvedImageUrl: normalizeImageUrl(topArt.imageUrl) || catImg,
          parsedVideo: parseVideoUrl(topArt.videoUrl),
          categoryColor: color,
        });
      }
    });

    // Pass 2: Any remaining articles
    const remainingArticles = sortWithUploadedFirst(
      articles.filter((a) => !usedIds.has(a.id))
    );
    remainingArticles.forEach((art) => {
      usedIds.add(art.id);
      const { catImg, color } = getCategoryMeta(art.category);
      result.push({
        article: art,
        resolvedImageUrl: normalizeImageUrl(art.imageUrl) || catImg,
        parsedVideo: parseVideoUrl(art.videoUrl),
        categoryColor: color,
      });
    });

    return result;
  }, [articles, categories]);

  // Keep currentIndex within bounds if slides length changes
  useEffect(() => {
    if (slides.length > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // 20-second automatic slide timer (ticks every 100ms for smooth progress bar & countdown)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      const nextElapsed = elapsedMsRef.current + TIMER_TICK_MS;
      if (nextElapsed >= SLIDE_INTERVAL_MS) {
        elapsedMsRef.current = 0;
        setElapsedMs(0);
        setCurrentIndex((curr) => (curr + 1) % slides.length);
      } else {
        elapsedMsRef.current = nextElapsed;
        setElapsedMs(nextElapsed);
      }
    }, TIMER_TICK_MS);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleGoToSlide = (index: number) => {
    if (slides.length === 0) return;
    const nextIndex = (index + slides.length) % slides.length;
    setCurrentIndex(nextIndex);
    elapsedMsRef.current = 0;
    setElapsedMs(0);
  };

  const activeSlide = slides[currentIndex] || slides[0];
  const {
    resolvedUrl: resolvedActiveVideoUrl,
    isResolving: isResolvingActiveVideo,
    isMissingLocal: isMissingLocalActiveVideo,
  } = useResolvedVideoUrl(activeSlide?.article.videoUrl);

  if (slides.length === 0 || !activeSlide) return null;

  const nextSlide = slides.length > 1 ? slides[(currentIndex + 1) % slides.length] : null;
  const { article, resolvedImageUrl, parsedVideo, categoryColor } = activeSlide;
  const effectiveDirectVideoUrl =
    parsedVideo && isDirectPlaybackType(parsedVideo.type)
      ? resolvedActiveVideoUrl || parsedVideo.directUrl
      : undefined;
  const badgeStyle =
    CATEGORY_BADGE_COLORS[article.category.toLowerCase()] || {
      bg: categoryColor,
      text: '#142304',
      border: categoryColor,
    };

  const totalSeconds = SLIDE_INTERVAL_MS / 1000;
  const remainingSeconds = Math.max(
    1,
    Math.min(totalSeconds, Math.ceil((SLIDE_INTERVAL_MS - elapsedMs) / 1000))
  );
  const progressPercentage = Math.min(100, Math.max(0, (elapsedMs / SLIDE_INTERVAL_MS) * 100));

  return (
    <section
      aria-label="Featured Category Dispatches Slideshow"
      className="bg-[#38080F] border-b border-[#58111A] pt-2 pb-8 px-4 sm:px-6"
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Top Kicker Row above the 1000x500 frame */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-bold uppercase tracking-widest text-[#F3C562]">
              Featured Category Dispatches
            </span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-300 hidden sm:inline">
              News · Features · Opinion · Sports (1000 × 500)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mute/Unmute toggle when active slide video supports audio toggle */}
            {parsedVideo && parsedVideo.supportsMuteToggle && (
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#28050B] border border-[#58111A] text-stone-200 hover:text-white transition-colors text-[11px] cursor-pointer"
                title={isMuted ? 'Unmute video sound' : 'Mute video sound'}
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3 text-amber-300" />
                ) : (
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                )}
                <span>{isMuted ? 'Unmute' : 'Sound On'}</span>
              </button>
            )}

            {/* 20s Auto-Slide status & pause/play toggle */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#28050B] border border-[#58111A] text-stone-300 hover:text-white transition-colors text-[11px] cursor-pointer"
              title={isPaused ? 'Resume 20-second slideshow' : 'Pause 20-second slideshow'}
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-[#84CC16]" />
              ) : (
                <Pause className="w-3 h-3 text-[#F3C562]" />
              )}
              <Clock className="w-3 h-3 text-stone-400" />
              <span className="tabular-nums">
                {isPaused
                  ? `Paused · ${remainingSeconds}s left`
                  : `Next slide in ${remainingSeconds}s`}
              </span>
            </button>
          </div>
        </div>

        {/* 1000 by 500 Sliding Picture / Video Container */}
        <div
          className="relative w-full max-w-[1000px] h-[300px] sm:h-[420px] md:h-[500px] mx-auto rounded-lg overflow-hidden border border-[#6B1420] shadow-2xl bg-[#1E0307] group select-none"
        >
          {/* Slide Media: Video (Local / YouTube / Google Drive / Vimeo / Facebook / TikTok / Direct .mp4 / Any Link) OR Picture (1000 x 500) */}
          {parsedVideo && !isMissingLocalActiveVideo ? (
            <div className="w-full h-full relative overflow-hidden bg-black">
              {isDirectPlaybackType(parsedVideo.type) ? (
                isResolvingActiveVideo || !effectiveDirectVideoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1E0307] text-stone-300 text-xs">
                    Loading video...
                  </div>
                ) : (
                  <video
                    key={`${article.id}-${effectiveDirectVideoUrl}`}
                    src={effectiveDirectVideoUrl}
                    poster={resolvedImageUrl || undefined}
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    onClick={() => onSelectArticle(article)}
                    className="w-full h-full object-cover object-center cursor-pointer"
                  />
                )
              ) : (
                <iframe
                  key={`${article.id}-${parsedVideo.type}-${isMuted ? 'muted' : 'sound'}-${parsedVideo.embedUrl}`}
                  src={
                    parsedVideo.supportsMuteToggle
                      ? isMuted
                        ? parsedVideo.mutedEmbedUrl || parsedVideo.embedUrl
                        : parsedVideo.unmutedEmbedUrl || parsedVideo.embedUrl
                      : parsedVideo.embedUrl
                  }
                  title={article.title}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              )}

              {/* Bottom gradient overlay ONLY in lower region so video controls stay usable while headline remains crisp */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div
              onClick={() => onSelectArticle(article)}
              className="w-full h-full cursor-pointer relative overflow-hidden"
              title={`Click to open post: ${article.title}`}
            >
              {resolvedImageUrl ? (
                <img
                  key={`${article.id}-${resolvedImageUrl}`}
                  src={resolvedImageUrl}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  onError={handleImageErrorWithDriveFallback}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <EditorialArtwork
                  category={article.category}
                  customImageUrl={article.imageUrl}
                  className="w-full h-full"
                  variant="lead"
                />
              )}

              {/* Editorial dark vignette & bottom gradient overlay for headline legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15 pointer-events-none" />
            </div>
          )}

          {/* Top-Left Category Badge, Video Tag & Slide Counter */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
              <span
                className="px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider shadow-md border"
                style={{
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.text,
                  borderColor: badgeStyle.border,
                }}
              >
                {article.category}
              </span>
              {parsedVideo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#4A0E17]/90 text-[#F3C562] text-[11px] font-bold uppercase tracking-wider border border-[#D4AF37]/60 shadow-md">
                  <Film className="w-3 h-3" />
                  <span>{parsedVideo.label}</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded bg-black/65 backdrop-blur-xs text-[11px] font-medium text-stone-200 border border-white/15">
                {article.issue} · {article.date}
              </span>
            </div>

            <div className="px-2.5 py-1 rounded bg-black/65 backdrop-blur-xs text-[11px] font-mono text-stone-200 border border-white/15">
              {currentIndex + 1} / {slides.length}
            </div>
          </div>

          {/* Left / Right Manual Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToSlide(currentIndex - 1);
                }}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#4A0E17] text-white border border-white/20 flex items-center justify-center transition-all opacity-85 hover:opacity-100 cursor-pointer shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToSlide(currentIndex + 1);
                }}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#4A0E17] text-white border border-white/20 flex items-center justify-center transition-all opacity-85 hover:opacity-100 cursor-pointer shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom Headline / Title Overlay — Clicking Title Automatically Links to the Post */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 z-10 flex flex-col justify-end pointer-events-none">
            <div className="max-w-3xl pointer-events-auto">
              <div className="flex items-center gap-2 text-xs text-[#F3C562] font-semibold uppercase tracking-wider mb-1.5">
                <span>By {article.author}</span>
                <span aria-hidden="true">·</span>
                <span className="text-stone-300 font-normal">{article.authorRole}</span>
              </div>

              {/* Clickable Headline / Title that links directly to the post */}
              <h3 className="m-0">
                <button
                  type="button"
                  onClick={() => onSelectArticle(article)}
                  className="text-left font-serif text-xl sm:text-3xl md:text-4xl font-bold text-white hover:text-[#F3C562] hover:underline decoration-[#F3C562]/80 underline-offset-4 leading-tight tracking-tight transition-colors cursor-pointer group/title drop-shadow-md"
                >
                  <span>{article.title}</span>
                  <ArrowUpRight className="inline-block w-5 h-5 sm:w-6 sm:h-6 ml-1.5 text-[#F3C562] transition-transform group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5" />
                </button>
              </h3>

              <p
                onClick={() => onSelectArticle(article)}
                className="mt-1.5 text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed cursor-pointer hover:text-white transition-colors drop-shadow-xs"
              >
                {article.deck}
              </p>
            </div>
          </div>

          {/* Smooth 20-Second Progress Accent Bar along the bottom edge of the 1000x500 frame */}
          {slides.length > 1 && (
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/50 backdrop-blur-xs z-20">
              <div
                className="h-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: isPaused ? '#A8A29E' : badgeStyle.bg,
                }}
              />
            </div>
          )}
        </div>

        {/* Category & Post Slide Selector Strip Below the 1000x500 Picture/Video */}
        <div className="mt-3 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => {
              const isCurrent = idx === currentIndex;
              const catStyle =
                CATEGORY_BADGE_COLORS[s.article.category.toLowerCase()] || {
                  bg: s.categoryColor,
                  text: '#142304',
                  border: s.categoryColor,
                };
              return (
                <button
                  key={s.article.id}
                  type="button"
                  onClick={() => handleGoToSlide(idx)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#4A0E17] text-white border-[#D4AF37] shadow-xs'
                      : 'bg-[#28050B]/90 text-stone-400 border-[#58111A] hover:text-stone-200 hover:border-stone-600'
                  }`}
                  title={`${s.article.category}${s.parsedVideo ? ' (Video)' : ''}: ${s.article.title}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catStyle.bg }}
                  />
                  {s.parsedVideo && <Film className="w-3 h-3 text-[#F3C562] shrink-0" />}
                  <span className="uppercase tracking-wider text-[10px] font-bold">
                    {s.article.category}
                  </span>
                  <span className="max-w-[110px] truncate hidden md:inline text-stone-300 font-normal">
                    — {s.article.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Visual Progress Bar & Auto-Advance Countdown Indicator */}
        {slides.length > 1 && (
          <div className="mt-2.5 rounded-md bg-[#28050B]/90 border border-[#58111A] px-3.5 py-2.5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#38080F] border border-[#6B1420] text-[#F3C562] hover:bg-[#4A0E17] hover:text-white transition-colors shrink-0 cursor-pointer"
                  aria-label={isPaused ? 'Resume slideshow countdown' : 'Pause slideshow countdown'}
                  title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                >
                  {isPaused ? (
                    <Play className="w-3 h-3 text-[#84CC16]" />
                  ) : (
                    <Pause className="w-3 h-3 text-[#F3C562]" />
                  )}
                </button>

                <span className="flex items-center gap-1.5 text-stone-300 font-medium truncate">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="tabular-nums font-semibold text-white">
                    {isPaused
                      ? `Slideshow paused (${remainingSeconds}s remaining)`
                      : `Auto-advancing in ${remainingSeconds}s`}
                  </span>
                  {nextSlide && (
                    <span className="hidden sm:inline text-stone-400 truncate">
                      · Up next:{' '}
                      <strong className="text-stone-200 uppercase text-[10px] tracking-wider">
                        {nextSlide.article.category}
                      </strong>{' '}
                      — {nextSlide.article.title}
                    </span>
                  )}
                </span>
              </div>

              <span className="font-mono text-[11px] tabular-nums text-[#F3C562] shrink-0">
                {String(remainingSeconds).padStart(2, '0')}s / {totalSeconds}s
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Time remaining before next slide"
              aria-valuemin={0}
              aria-valuemax={totalSeconds}
              aria-valuenow={Math.round(elapsedMs / 1000)}
              aria-valuetext={
                isPaused
                  ? `Paused with ${remainingSeconds} seconds remaining`
                  : `${remainingSeconds} seconds remaining before next slide`
              }
              className="relative h-2 w-full rounded-full bg-[#160205] border border-[#58111A]/80 overflow-hidden"
            >
              <div
                className="h-full rounded-full transition-[width] duration-100 ease-linear relative"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: isPaused ? '#A8A29E' : badgeStyle.bg,
                }}
              >
                {!isPaused && progressPercentage > 1 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
