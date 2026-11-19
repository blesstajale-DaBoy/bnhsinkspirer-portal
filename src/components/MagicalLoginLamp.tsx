import React, { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface MagicalLoginLampProps {
  isLit: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export const MagicalLoginLamp: React.FC<MagicalLoginLampProps> = ({
  isLit,
  onToggle,
  compact = false,
}) => {
  const [pullOffset, setPullOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const maxDragRef = useRef(0);

  const triggerPullAnimationAndToggle = () => {
    setPullOffset(34);
    setTimeout(() => {
      onToggle();
      setPullOffset(0);
    }, 150);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartYRef.current = e.clientY;
    maxDragRef.current = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || dragStartYRef.current === null) return;
    const rawDelta = e.clientY - dragStartYRef.current;
    // Slight elastic damping after 30px
    const clamped =
      rawDelta <= 0
        ? 0
        : rawDelta <= 32
        ? rawDelta
        : 32 + Math.min(20, (rawDelta - 32) * 0.45);
    if (clamped > maxDragRef.current) {
      maxDragRef.current = clamped;
    }
    setPullOffset(clamped);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    const dragged = maxDragRef.current;
    dragStartYRef.current = null;
    maxDragRef.current = 0;

    // Trigger toggle either on a deliberate downward pull (>= 18px) or a quick click (< 6px)
    if (dragged >= 18) {
      onToggle();
      setPullOffset(0);
    } else if (dragged < 6) {
      triggerPullAnimationAndToggle();
    } else {
      setPullOffset(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPullAnimationAndToggle();
    }
  };

  const baseCordLength = compact ? 54 : 74;
  const currentCordEndY = 128 + baseCordLength + pullOffset;
  const pullProgress = Math.min(1, pullOffset / 24);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ${
        compact ? 'py-5 px-4' : 'py-8 px-6'
      }`}
    >
      {/* Magical Warm Ambient Glow behind the lamp when lit */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          isLit ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(243, 197, 98, 0.30) 0%, rgba(212, 175, 55, 0.14) 36%, rgba(52, 7, 14, 0) 72%)',
        }}
      />

      {/* Floating Golden Sparkles when lit */}
      {isLit && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-[#FDE68A] animate-pulse"
            style={{ top: '26%', left: '24%', boxShadow: '0 0 10px #F3C562' }}
          />
          <span
            className="absolute w-1 h-1 rounded-full bg-[#F3C562] animate-bounce"
            style={{ top: '44%', right: '22%', animationDuration: '2.8s', boxShadow: '0 0 8px #F3C562' }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-[#FEF08A] animate-ping"
            style={{ top: '58%', left: '28%', animationDuration: '3.2s' }}
          />
          <span
            className="absolute w-1 h-1 rounded-full bg-[#FDE68A] animate-pulse"
            style={{ top: '34%', right: '30%', animationDelay: '0.6s' }}
          />
        </div>
      )}

      {/* Interactive Artisan Study Lamp SVG + Pull-String Sling Switch */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <svg
            viewBox="0 0 240 270"
            className={`${compact ? 'w-44 h-48' : 'w-56 h-64'} overflow-visible drop-shadow-2xl`}
            role="img"
            aria-label={isLit ? 'Glowing Editorial Study Lamp' : 'Unlit Editorial Study Lamp'}
          >
            <defs>
              {/* Warm Light Cone Gradient */}
              <linearGradient id="lampBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.62" />
                <stop offset="40%" stopColor="#F3C562" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>

              {/* Lit Lampshade Gradient */}
              <linearGradient id="shadeLitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7C1D2A" />
                <stop offset="48%" stopColor="#A62B3A" />
                <stop offset="100%" stopColor="#F3C562" />
              </linearGradient>

              {/* Unlit Lampshade Gradient */}
              <linearGradient id="shadeOffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2B0910" />
                <stop offset="65%" stopColor="#46101B" />
                <stop offset="100%" stopColor="#5C1A26" />
              </linearGradient>

              {/* Brass Metal Gradient */}
              <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A6820" />
                <stop offset="45%" stopColor="#F3C562" />
                <stop offset="75%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#785818" />
              </linearGradient>

              {/* Glowing Bulb Radial Gradient */}
              <radialGradient id="bulbGlowGrad" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </radialGradient>
            </defs>

            {/* Warm Cone of Light (visible when lit) */}
            <polygon
              points="64,126 176,126 232,268 8,268"
              fill="url(#lampBeamGrad)"
              className={`transition-opacity duration-500 ${isLit ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Desk Reflection Pool under Lamp Base */}
            <ellipse
              cx="120"
              cy="252"
              rx={isLit ? 88 : 54}
              ry={isLit ? 12 : 8}
              fill={isLit ? 'rgba(243, 197, 98, 0.25)' : 'rgba(0, 0, 0, 0.45)'}
              className="transition-all duration-500"
            />

            {/* Brass Stand / Neck */}
            <rect x="115" y="126" width="10" height="110" rx="4" fill="url(#brassGrad)" />
            {/* Decorative Brass Collar Rings */}
            <rect x="111" y="152" width="18" height="5" rx="2.5" fill="url(#brassGrad)" />
            <rect x="110" y="220" width="20" height="7" rx="3" fill="url(#brassGrad)" />

            {/* Stepped Antique Brass Base */}
            <path
              d="M74 248 C74 236, 94 231, 120 231 C146 231, 166 236, 166 248 Z"
              fill="url(#brassGrad)"
            />
            <rect x="68" y="246" width="104" height="7" rx="3.5" fill="#6E4E14" />
            <rect x="70" y="245" width="100" height="3.5" rx="1.75" fill="#F3C562" opacity="0.65" />

            {/* Under-Shade Opening & Bulb */}
            <ellipse
              cx="120"
              cy="126"
              rx="56"
              ry="10"
              fill={isLit ? '#FDE68A' : '#1E060A'}
              stroke="#D4AF37"
              strokeWidth="1.5"
              className="transition-colors duration-500"
            />

            {/* Light Bulb */}
            <circle
              cx="120"
              cy="128"
              r={isLit ? 14 : 11}
              fill={isLit ? 'url(#bulbGlowGrad)' : '#44403C'}
              className="transition-all duration-300"
              style={
                isLit
                  ? { filter: 'drop-shadow(0 0 14px rgba(254, 240, 138, 0.95))' }
                  : undefined
              }
            />

            {/* Lampshade Finial Top */}
            <circle cx="120" cy="40" r="6" fill="url(#brassGrad)" />
            <rect x="117" y="44" width="6" height="8" fill="url(#brassGrad)" />

            {/* Trapezoid Editorial Lampshade */}
            <path
              d="M84 52 L156 52 L176 126 L64 126 Z"
              fill={isLit ? 'url(#shadeLitGrad)' : 'url(#shadeOffGrad)'}
              stroke="#D4AF37"
              strokeWidth="2.2"
              strokeLinejoin="round"
              className="transition-all duration-500"
              style={
                isLit
                  ? { filter: 'drop-shadow(0 0 18px rgba(243, 197, 98, 0.45))' }
                  : undefined
              }
            />

            {/* Gold Trim Band across Shade */}
            <line x1="82" y1="59" x2="158" y2="59" stroke="#F3C562" strokeWidth="1.5" opacity={isLit ? 0.9 : 0.45} />
            <line x1="66" y1="119" x2="174" y2="119" stroke="#F3C562" strokeWidth="1.8" opacity={isLit ? 0.95 : 0.5} />

            {/* Subtle Inkspirer Quill Emblem on Shade */}
            <g opacity={isLit ? 0.95 : 0.35} className="transition-opacity duration-500">
              <circle cx="120" cy="89" r="14" fill="rgba(52,7,14,0.45)" stroke="#F3C562" strokeWidth="1.2" />
              <path
                d="M114 96 C117 88, 121 82, 127 79 C125 85, 122 91, 115 96 Z"
                fill="#F3C562"
              />
              <line x1="113" y1="97" x2="122" y2="85" stroke="#34070E" strokeWidth="1.2" />
            </g>

            {/* PULL-STRING / SLING SWITCH (Beaded Brass Chain + Tassel) */}
            <g>
              {/* Cord Line */}
              <line
                x1="152"
                y1="126"
                x2="152"
                y2={currentCordEndY}
                stroke="#F3C562"
                strokeWidth="2.4"
                strokeDasharray="3 3"
                strokeLinecap="round"
              />
              {/* Top eyelet under shade */}
              <circle cx="152" cy="128" r="3" fill="#D4AF37" />
              {/* Sling Knob / Tassel Handle */}
              <g transform={`translate(152, ${currentCordEndY})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="6"
                  fill="url(#brassGrad)"
                  stroke="#34070E"
                  strokeWidth="1"
                />
                {/* Ornate Golden Sling Ring & Pendant */}
                <path
                  d="M-5 5 L5 5 L8 18 C8 22, -8 22, -8 18 Z"
                  fill={isLit ? '#F3C562' : '#D4AF37'}
                  stroke="#5C1521"
                  strokeWidth="1.2"
                  style={
                    !isLit || pullProgress > 0.2
                      ? { filter: 'drop-shadow(0 0 8px rgba(243, 197, 98, 0.75))' }
                      : undefined
                  }
                />
                <circle cx="0" cy="12" r="2.2" fill="#4A0E17" />
              </g>
            </g>
          </svg>

          {/* Invisible Generous Interactive Pull-String Hitbox aligned over the sling switch */}
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={handleKeyDown}
            aria-pressed={isLit}
            aria-label={
              isLit
                ? 'Pull lamp sling switch to turn off light'
                : 'Pull lamp sling switch down to turn on lamp and reveal Editorial Board Role Login'
            }
            title="Drag downward or click the sling switch"
            style={{
              top: compact ? '46%' : '45%',
              right: compact ? '18%' : '18%',
              transform: `translateY(${pullOffset}px)`,
              transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={`absolute w-14 h-28 rounded-full touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C562] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          />
        </div>

        {/* Interactive Caption & Explicit Pull Sling Switch Trigger Button */}
        <div className="mt-2 text-center space-y-2.5 max-w-xs">
          {!isLit ? (
            <>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#F3C562]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>The Inkspirer Study Lamp</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
                Illuminate the Editorial Desk
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Pull the golden <strong className="text-[#F3C562]">sling switch</strong> downward (or click below) to light the lamp and reveal the Editorial Board Role Login.
              </p>
              <button
                type="button"
                onClick={triggerPullAnimationAndToggle}
                className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A0E17] hover:bg-[#60121F] text-[#F3C562] border border-[#D4AF37]/70 text-xs font-bold shadow-lg hover:shadow-[#D4AF37]/20 transition-all cursor-pointer"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#F3C562] animate-ping" />
                <span>Pull Sling Switch</span>
              </button>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3C562]/15 border border-[#F3C562]/40 text-[#F3C562] text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                <span>Lamp Illuminated</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Pull the sling switch again anytime to dim the study lamp.
              </p>
              <button
                type="button"
                onClick={triggerPullAnimationAndToggle}
                className="text-[11px] font-semibold text-stone-400 hover:text-[#F3C562] underline underline-offset-4 transition-colors cursor-pointer"
              >
                Pull switch off
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
