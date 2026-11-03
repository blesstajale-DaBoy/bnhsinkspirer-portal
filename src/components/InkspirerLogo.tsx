import React from 'react';

interface InkspirerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showBorder?: boolean;
}

export const InkspirerLogo: React.FC<InkspirerLogoProps> = ({
  className = '',
  size = 'md',
  showBorder = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    hero: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32',
  };

  const imageSizeClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
    hero: 'p-2',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}
      aria-label="The Inkspirer Official Publication Logo"
    >
      <div
        className={`w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md transition-transform duration-300 ${
          showBorder ? 'border-2 border-[#D4AF37]/90 ring-2 ring-[#4A0E17]/20' : ''
        }`}
      >
        <img
          src="/assets/aistudio/inkspirer_logo_6a2deb81.png"
          alt="The Inkspirer - Official Publication Logo"
          className={`w-full h-full object-contain ${imageSizeClasses[size]}`}
          loading="eager"
        />
      </div>
    </div>
  );
};
