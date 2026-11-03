import React from 'react';
import { Category } from '../types';

interface EditorialArtworkProps {
  category: Category;
  className?: string;
  variant?: 'lead' | 'card' | 'compact';
  customImageUrl?: string;
}

export const EditorialArtwork: React.FC<EditorialArtworkProps> = ({
  category,
  className = '',
  variant = 'card',
  customImageUrl,
}) => {
  if (customImageUrl) {
    return (
      <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
        <img
          src={customImageUrl}
          alt={`${category} article visual`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    );
  }

  // Domain-specific editorial SVG artworks
  switch (category) {
    case 'News':
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#133E87] to-[#1E293B] text-white flex items-center justify-center p-6 ${className}`}
        >
          {/* Subtle newspaper grid background pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            viewBox="0 0 240 160"
            className="w-full h-full max-h-48 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Newspaper silhouette */}
            <rect x="25" y="20" width="130" height="120" rx="4" fill="#F8FAFC" opacity="0.95" />
            <rect x="35" y="32" width="70" height="8" rx="2" fill="#0B2545" />
            <rect x="35" y="46" width="110" height="4" rx="1" fill="#94A3B8" />
            <rect x="35" y="54" width="110" height="4" rx="1" fill="#94A3B8" />
            <rect x="35" y="66" width="50" height="34" rx="2" fill="#CBD5E1" />
            <rect x="92" y="66" width="53" height="4" rx="1" fill="#64748B" />
            <rect x="92" y="74" width="53" height="4" rx="1" fill="#94A3B8" />
            <rect x="92" y="82" width="53" height="4" rx="1" fill="#94A3B8" />
            <rect x="92" y="90" width="53" height="4" rx="1" fill="#94A3B8" />
            <rect x="92" y="98" width="35" height="4" rx="1" fill="#94A3B8" />
            <rect x="35" y="108" width="110" height="4" rx="1" fill="#64748B" />
            <rect x="35" y="116" width="110" height="4" rx="1" fill="#94A3B8" />
            <rect x="35" y="124" width="80" height="4" rx="1" fill="#94A3B8" />

            {/* Camera / Press badge */}
            <g transform="translate(140, 60)">
              <circle cx="45" cy="45" r="36" fill="#D4AF37" opacity="0.2" />
              <rect x="18" y="24" width="54" height="42" rx="6" fill="#D4AF37" />
              <path d="M36 18H54L58 24H32L36 18Z" fill="#B48E1D" />
              <circle cx="45" cy="45" r="14" fill="#0B2545" />
              <circle cx="45" cy="45" r="9" fill="#133E87" />
              <circle cx="42" cy="42" r="3" fill="#F8FAFC" />
              <circle cx="62" cy="30" r="3" fill="#F8FAFC" />
            </g>

            {/* Ink drop flourish */}
            <path
              d="M195 35 C195 35 185 50 185 58 C185 64 189 68 195 68 C201 68 205 64 205 58 C205 50 195 35 195 35 Z"
              fill="#D4AF37"
            />
          </svg>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-sans tracking-widest uppercase text-white/70">
            BAROBO PRESS CORPS · CAMPUS NEWS WIRE
          </div>
        </div>
      );

    case 'Features':
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0F766E] text-white flex items-center justify-center p-6 ${className}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            viewBox="0 0 240 160"
            className="w-full h-full max-h-48 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mangrove leaf & science laboratory beaker */}
            <path
              d="M120 18 C70 18 45 60 55 105 C62 135 120 148 120 148 C120 148 178 135 185 105 C195 60 170 18 120 18 Z"
              fill="#022C22"
              opacity="0.35"
            />
            {/* Stem Beaker */}
            <path
              d="M85 35 L105 75 L65 135 C60 142 66 148 75 148 H135 C144 148 150 142 145 135 L105 75 L125 35 Z"
              stroke="#A7F3D0"
              strokeWidth="4"
              strokeLinejoin="round"
              fill="rgba(255,255,255,0.06)"
            />
            <path
              d="M78 118 L84 108 C90 115 100 115 106 108 C112 115 122 115 128 108 L132 118 C138 128 132 142 120 142 H90 C78 142 72 128 78 118 Z"
              fill="#34D399"
              opacity="0.8"
            />
            {/* Bubbles */}
            <circle cx="95" cy="125" r="4" fill="#ECFDF5" />
            <circle cx="112" cy="118" r="3" fill="#ECFDF5" />
            <circle cx="102" cy="100" r="2.5" fill="#ECFDF5" />

            {/* Mangrove sprout / feather quill */}
            <path
              d="M165 40 Q185 75 160 125 M165 40 Q135 60 148 95 Q155 112 160 125 M165 40 Q195 60 180 95 Q170 115 160 125"
              stroke="#D4AF37"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-sans tracking-widest uppercase text-emerald-100/70">
            BAROBO SCHOLARS & COASTAL FEATURES
          </div>
        </div>
      );

    case 'Opinion':
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#4C1D95] text-white flex items-center justify-center p-6 ${className}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            viewBox="0 0 240 160"
            className="w-full h-full max-h-48 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Giant editorial quotation mark */}
            <text
              x="30"
              y="110"
              fontFamily="Playfair Display, Georgia, serif"
              fontSize="120"
              fill="#E9D5FF"
              opacity="0.25"
            >
              “
            </text>

            {/* Ornate Gold Fountain Pen Nib */}
            <g transform="translate(100, 20)">
              <path
                d="M30 10 L45 50 L42 105 L30 125 L18 105 L15 50 Z"
                fill="#D4AF37"
                stroke="#B48E1D"
                strokeWidth="2"
              />
              <path d="M30 10 L30 80" stroke="#4C1D95" strokeWidth="2.5" />
              <circle cx="30" cy="80" r="4" fill="#4C1D95" />
              <path d="M22 105 H38" stroke="#78350F" strokeWidth="2" />
            </g>

            {/* Open editorial notebook */}
            <rect x="145" y="45" width="65" height="75" rx="3" fill="#FAF5FF" opacity="0.9" />
            <line x1="155" y1="60" x2="195" y2="60" stroke="#A855F7" strokeWidth="2" />
            <line x1="155" y1="72" x2="200" y2="72" stroke="#D8B4FE" strokeWidth="2" />
            <line x1="155" y1="84" x2="200" y2="84" stroke="#D8B4FE" strokeWidth="2" />
            <line x1="155" y1="96" x2="185" y2="96" stroke="#D8B4FE" strokeWidth="2" />
          </svg>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-sans tracking-widest uppercase text-purple-200/70">
            STUDENT PERSPECTIVES & EDITORIALS
          </div>
        </div>
      );

    case 'Sports':
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#78350F] via-[#B45309] to-[#92400E] text-white flex items-center justify-center p-6 ${className}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            viewBox="0 0 240 160"
            className="w-full h-full max-h-48 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Athletic stadium tracks and basketball silhouette */}
            <circle cx="70" cy="80" r="45" stroke="#FDE68A" strokeWidth="4" strokeDasharray="6 6" fill="rgba(0,0,0,0.15)" />
            <circle cx="70" cy="80" r="32" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
            {/* Basketball seams */}
            <path d="M38 80 H102" stroke="#78350F" strokeWidth="2" />
            <path d="M70 48 V112" stroke="#78350F" strokeWidth="2" />
            <path d="M48 58 Q70 75 92 58" stroke="#78350F" strokeWidth="2" fill="none" />
            <path d="M48 102 Q70 85 92 102" stroke="#78350F" strokeWidth="2" fill="none" />

            {/* Champion Laurel / Trophy */}
            <g transform="translate(140, 35)">
              <path
                d="M20 20 H50 L45 55 C43 68 27 68 25 55 Z"
                fill="#FBBF24"
                stroke="#B45309"
                strokeWidth="2"
              />
              <path d="M35 58 V75 M22 75 H48" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
              <path d="M20 30 Q10 32 10 42 Q10 52 22 50" stroke="#FBBF24" strokeWidth="3" fill="none" />
              <path d="M50 30 Q60 32 60 42 Q60 52 48 50" stroke="#FBBF24" strokeWidth="3" fill="none" />
              <polygon points="35,32 38,40 46,40 40,45 42,53 35,48 28,53 30,45 24,40 32,40" fill="#78350F" />
            </g>
          </svg>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-sans tracking-widest uppercase text-amber-100/70">
            BLUE MARLINS ATHLETICS & INTRAMURALS
          </div>
        </div>
      );

    case 'Announcements':
    default:
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#7F1D1D] via-[#991B1B] to-[#450A0A] text-white flex items-center justify-center p-6 ${className}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg
            viewBox="0 0 240 160"
            className="w-full h-full max-h-48 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Campus Bell Tower & Official Scroll */}
            <g transform="translate(45, 30)">
              <path
                d="M40 20 C25 20 20 40 18 65 L10 75 H70 L62 65 C60 40 55 20 40 20 Z"
                fill="#FEF08A"
                stroke="#B45309"
                strokeWidth="2.5"
              />
              <circle cx="40" cy="82" r="5" fill="#B45309" />
              <rect x="35" y="10" width="10" height="10" rx="2" fill="#B45309" />
            </g>

            {/* Official Bulletin Notice */}
            <rect x="130" y="30" width="70" height="90" rx="3" fill="#FFF1F2" />
            <rect x="140" y="42" width="50" height="6" rx="2" fill="#991B1B" />
            <line x1="140" y1="58" x2="190" y2="58" stroke="#F43F5E" strokeWidth="2" />
            <line x1="140" y1="70" x2="190" y2="70" stroke="#FDA4AF" strokeWidth="2" />
            <line x1="140" y1="82" x2="190" y2="82" stroke="#FDA4AF" strokeWidth="2" />
            <line x1="140" y1="94" x2="175" y2="94" stroke="#FDA4AF" strokeWidth="2" />
            <circle cx="165" cy="28" r="4" fill="#991B1B" />
          </svg>
          <div className="absolute bottom-2.5 left-3 text-[11px] font-sans tracking-widest uppercase text-rose-100/70">
            BAROBO NHS OFFICIAL CAMPUS GAZETTE
          </div>
        </div>
      );
  }
};
