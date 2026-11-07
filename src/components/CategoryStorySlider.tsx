import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Camera,
  Upload,
  Link as LinkIcon,
  X,
  Check,
  Clock,
  Pause,
  Play,
} from 'lucide-react';
import { Article, PublicationCategory } from '../types';
import { normalizeImageUrl, handleImageErrorWithDriveFallback } from '../utils/imageUrl';
import { EditorialArtwork } from './EditorialArtwork';

interface CategoryStorySliderProps {
  articles: Article[];
  categories: PublicationCategory[];
  onSelectArticle: (article: Article) => void;
  onUpdateArticle?: (updated: Article) => void;
}

const SLIDE_INTERVAL_MS = 20000; // 20 seconds as requested

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
  onUpdateArticle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Modal state for uploading/updating a slide picture linked to a post
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('News');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [slideImageUrlInput, setSlideImageUrlInput] = useState<string>('');
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build ordered slides from articles across NEWS, FEATURES, OPINION, SPORTS (and any custom categories)
  // Interleaves the top story of News, Features, Opinion, Sports first (prioritizing posts with uploaded photos),
  // followed by any remaining posts so every category and uploaded story photo is showcased.
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

    // Sort helper: prioritize articles that have an explicit uploaded imageUrl
    const sortWithUploadedFirst = (list: Article[]) => {
      return [...list].sort((a, b) => {
        const aHasImg = Boolean(a.imageUrl && a.imageUrl.trim());
        const bHasImg = Boolean(b.imageUrl && b.imageUrl.trim());
        if (aHasImg && !bHasImg) return -1;
        if (!aHasImg && bHasImg) return 1;
        return 0;
      });
    };

    const usedIds = new Set<string>();
    const result: { article: Article; resolvedImageUrl: string; categoryColor: string }[] = [];

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
          categoryColor: color,
        });
      }
    });

    // Pass 2: Any remaining articles that have uploaded photos or belong to the publication
    const remainingArticles = sortWithUploadedFirst(
      articles.filter((a) => !usedIds.has(a.id))
    );
    remainingArticles.forEach((art) => {
      usedIds.add(art.id);
      const { catImg, color } = getCategoryMeta(art.category);
      result.push({
        article: art,
        resolvedImageUrl: normalizeImageUrl(art.imageUrl) || catImg,
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

  // 20-second automatic slide timer (ticks every 1s to drive progress bar & switches at 20s)
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isUploadModalOpen) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= SLIDE_INTERVAL_MS / 1000) {
          setCurrentIndex((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, isUploadModalOpen]);

  const handleGoToSlide = (index: number) => {
    if (slides.length === 0) return;
    const nextIndex = (index + slides.length) % slides.length;
    setCurrentIndex(nextIndex);
    setElapsedSeconds(0);
  };

  const handleOpenUploadModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentSlide = slides[currentIndex];
    if (currentSlide) {
      setSelectedCategoryFilter(currentSlide.article.category);
      setSelectedPostId(currentSlide.article.id);
      setSlideImageUrlInput(currentSlide.article.imageUrl || '');
    } else if (articles.length > 0) {
      setSelectedCategoryFilter(articles[0].category);
      setSelectedPostId(articles[0].id);
      setSlideImageUrlInput(articles[0].imageUrl || '');
    }
    setUploadSuccessBanner(null);
    setIsUploadModalOpen(true);
  };

  const handleCategoryChangeInModal = (catName: string) => {
    setSelectedCategoryFilter(catName);
    const matchingPosts = articles.filter(
      (a) => a.category.toLowerCase() === catName.toLowerCase()
    );
    if (matchingPosts.length > 0) {
      setSelectedPostId(matchingPosts[0].id);
      setSlideImageUrlInput(matchingPosts[0].imageUrl || '');
    } else {
      setSelectedPostId('');
      setSlideImageUrlInput('');
    }
  };

  const handlePostChangeInModal = (postId: string) => {
    setSelectedPostId(postId);
    const found = articles.find((a) => a.id === postId);
    if (found) {
      setSlideImageUrlInput(found.imageUrl || '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 1000;
        const targetHeight = 500;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Cover crop to 1000x500 (2:1 aspect ratio)
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const dx = (targetWidth - scaledWidth) / 2;
          const dy = (targetHeight - scaledHeight) / 2;
          ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
          setSlideImageUrlInput(compressedDataUrl);
        } else {
          setSlideImageUrlInput(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSlideImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !onUpdateArticle) return;
    const targetPost = articles.find((a) => a.id === selectedPostId);
    if (!targetPost) return;
    const normalized = normalizeImageUrl(slideImageUrlInput);
    onUpdateArticle({
      ...targetPost,
      imageUrl: normalized || undefined,
    });

    // Jump to the updated post's slide
    const targetSlideIdx = slides.findIndex((s) => s.article.id === selectedPostId);
    if (targetSlideIdx !== -1) {
      setCurrentIndex(targetSlideIdx);
      setElapsedSeconds(0);
    }

    setUploadSuccessBanner(
      `Updated 1000×500 slide picture for "${targetPost.title}"!`
    );
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadSuccessBanner(null);
    }, 1100);
  };

  if (slides.length === 0) return null;

  const activeSlide = slides[currentIndex] || slides[0];
  const { article, resolvedImageUrl, categoryColor } = activeSlide;
  const badgeStyle =
    CATEGORY_BADGE_COLORS[article.category.toLowerCase()] || {
      bg: categoryColor,
      text: '#142304',
      border: categoryColor,
    };

  const postsInSelectedCategory = articles.filter(
    (a) => a.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
  );

  const availableCategories = [
    'News',
    'Features',
    'Opinion',
    'Sports',
    ...categories
      .map((c) => c.name)
      .filter(
        (n) =>
          !['news', 'features', 'opinion', 'sports', 'announcements'].includes(
            n.toLowerCase()
          )
      ),
  ];

  const progressPercentage = ((elapsedSeconds / (SLIDE_INTERVAL_MS / 1000)) * 100).toFixed(1);

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
                  ? 'Paused (20s interval)'
                  : `Next slide in ${Math.max(1, 20 - elapsedSeconds)}s`}
              </span>
            </button>

            {onUpdateArticle && (
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4A0E17] hover:bg-[#5C1521] text-[#F3C562] border border-[#6B1420] transition-colors text-[11px] font-semibold cursor-pointer shadow-2xs"
                title="Upload or change the 1000×500 slide photo for News, Features, Opinion, or Sports posts"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Slide Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* 1000 by 500 Sliding Picture Container */}
        <div
          className="relative w-full max-w-[1000px] h-[300px] sm:h-[420px] md:h-[500px] mx-auto rounded-lg overflow-hidden border border-[#6B1420] shadow-2xl bg-[#1E0307] group select-none"
        >
          {/* Slide Picture (1000 x 500) */}
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

          {/* Top-Left Category Badge & Slide Counter */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
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
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 z-10 flex flex-col justify-end">
            <div className="max-w-3xl">
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
                  className="text-left font-serif text-xl sm:text-3xl md:text-4xl font-bold text-white hover:text-[#F3C562] hover:underline decoration-[#F3C562]/80 underline-offset-4 leading-tight tracking-tight transition-colors cursor-pointer group/title"
                >
                  <span>{article.title}</span>
                  <ArrowUpRight className="inline-block w-5 h-5 sm:w-6 sm:h-6 ml-1.5 text-[#F3C562] transition-transform group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5" />
                </button>
              </h3>

              <p
                onClick={() => onSelectArticle(article)}
                className="mt-2 text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed cursor-pointer hover:text-white transition-colors"
              >
                {article.deck}
              </p>
            </div>
          </div>

          {/* 20-Second Progress Bar at very bottom edge of the 1000x500 frame */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15 z-20">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: badgeStyle.bg,
              }}
            />
          </div>
        </div>

        {/* Category & Post Slide Selector Strip Below the 1000x500 Picture */}
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
                  title={`${s.article.category}: ${s.article.title}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catStyle.bg }}
                  />
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
      </div>

      {/* Modal to Upload or Paste 1000x500 Slide Picture for a Category Post */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            className="bg-[#FFFDF9] text-stone-900 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#6B1420]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Maroon Header */}
            <div className="bg-[#4A0E17] text-white px-5 py-4 flex items-center justify-between border-b border-[#6B1420]">
              <div>
                <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#F3C562]" />
                  <span>Upload 1000 × 500 Category Slide Picture</span>
                </h4>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Attach a photo to a News, Features, Opinion, or Sports post in the slideshow
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlideImage} className="p-5 space-y-4 text-xs">
              {uploadSuccessBanner && (
                <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessBanner}</span>
                </div>
              )}

              {/* Step 1: Select Category */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  1. Select Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map((catName) => {
                    const active =
                      selectedCategoryFilter.toLowerCase() === catName.toLowerCase();
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => handleCategoryChangeInModal(catName)}
                        className={`px-3 py-1.5 rounded font-bold uppercase tracking-wider text-[11px] border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#4A0E17] text-[#F3C562] border-[#4A0E17]'
                            : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {catName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Post in that Category */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  2. Link Picture to Post ({selectedCategoryFilter})
                </label>
                {postsInSelectedCategory.length > 0 ? (
                  <select
                    value={selectedPostId}
                    onChange={(e) => handlePostChangeInModal(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-stone-300 bg-white text-stone-900 font-medium focus:outline-none focus:border-[#4A0E17]"
                  >
                    {postsInSelectedCategory.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-stone-500 italic">
                    No published posts found in {selectedCategoryFilter}.
                  </p>
                )}
              </div>

              {/* Step 3: Upload File or Paste Image URL / Google Drive Link */}
              {selectedPostId && (
                <div className="space-y-3">
                  <label className="block font-bold uppercase tracking-wider text-stone-700">
                    3. Upload Picture (1000 × 500) or Paste Image / Google Drive Link
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-[#4A0E17] text-[#F3C562] font-semibold hover:bg-[#5C1521] transition-colors cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo File</span>
                    </button>

                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={slideImageUrlInput}
                        onChange={(e) => setSlideImageUrlInput(e.target.value)}
                        placeholder="Or paste image URL / Google Drive share link..."
                        className="w-full pl-8 pr-3 py-2 rounded border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                      />
                    </div>
                  </div>

                  {/* Live 2:1 (1000x500) Preview */}
                  {slideImageUrlInput && (
                    <div className="rounded-lg overflow-hidden border border-stone-300 bg-stone-900 relative aspect-[2/1] max-h-48 w-full">
                      <img
                        src={normalizeImageUrl(slideImageUrlInput)}
                        alt="Slide preview"
                        referrerPolicy="no-referrer"
                        onError={handleImageErrorWithDriveFallback}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white px-2.5 py-1.5 rounded text-[11px] truncate">
                        Headline Link:{' '}
                        <span className="font-serif font-bold text-[#F3C562]">
                          {articles.find((a) => a.id === selectedPostId)?.title}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 rounded border border-stone-300 text-stone-700 hover:bg-stone-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPostId}
                  className="px-4 py-2 rounded bg-[#4A0E17] text-[#F3C562] font-bold hover:bg-[#5C1521] disabled:opacity-50 cursor-pointer"
                >
                  Save Slide Picture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
