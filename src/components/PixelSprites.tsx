import React, { useState } from 'react';

export const PixelCreatureSprite: React.FC<{
  className?: string;
  color?: string;
  eyeColor?: string;
}> = ({ className = 'w-8 h-8', color = '#4A6B53', eyeColor = '#F6F3EB' }) => (
  <svg
    viewBox="0 0 16 16"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Pen sticking out of head */}
    <rect x="7" y="0" width="2" height="3" fill="#D95D39" />
    <rect x="7" y="3" width="2" height="1" fill="#E6B84D" />
    {/* Ears / Horns */}
    <rect x="2" y="3" width="2" height="2" fill={color} />
    <rect x="12" y="3" width="2" height="2" fill={color} />
    {/* Head & Body */}
    <rect x="3" y="4" width="10" height="9" fill={color} />
    <rect x="2" y="6" width="12" height="6" fill={color} />
    {/* Dark Outline blocks */}
    <rect x="3" y="3" width="10" height="1" fill="#1C1917" />
    <rect x="3" y="13" width="10" height="1" fill="#1C1917" />
    {/* Eyes */}
    <rect x="4" y="6" width="3" height="3" fill={eyeColor} />
    <rect x="9" y="6" width="3" height="3" fill={eyeColor} />
    <rect x="5" y="7" width="2" height="2" fill="#1C1917" />
    <rect x="10" y="7" width="2" height="2" fill="#1C1917" />
    {/* Grumpy / Quirky Mouth */}
    <rect x="6" y="10" width="4" height="1" fill="#1C1917" />
    <rect x="5" y="11" width="1" height="1" fill="#1C1917" />
    <rect x="10" y="11" width="1" height="1" fill="#1C1917" />
    {/* Little Feet */}
    <rect x="4" y="14" width="2" height="2" fill="#1C1917" />
    <rect x="10" y="14" width="2" height="2" fill="#1C1917" />
  </svg>
);

export const PixelChompSprite: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 16 16"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Pencil tip sticking out */}
    <rect x="9" y="1" width="2" height="3" fill="#E6B84D" />
    <rect x="9" y="0" width="2" height="1" fill="#1C1917" />
    {/* Chomper Body */}
    <rect x="3" y="4" width="10" height="9" fill="#D95D39" />
    {/* Teeth on top */}
    <rect x="4" y="4" width="2" height="2" fill="#F6F3EB" />
    <rect x="7" y="4" width="2" height="2" fill="#F6F3EB" />
    <rect x="10" y="4" width="2" height="2" fill="#F6F3EB" />
    {/* Eyes */}
    <rect x="4" y="8" width="2" height="2" fill="#1C1917" />
    <rect x="10" y="8" width="2" height="2" fill="#1C1917" />
    {/* Feet */}
    <rect x="3" y="13" width="3" height="2" fill="#1C1917" />
    <rect x="10" y="13" width="3" height="2" fill="#1C1917" />
  </svg>
);

export const PixelBlobSprite: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 16 16"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Two Pens sticking out */}
    <rect x="5" y="1" width="2" height="4" fill="#4A6B53" />
    <rect x="9" y="2" width="2" height="3" fill="#D95D39" />
    {/* Puddle Blob Body */}
    <rect x="4" y="5" width="8" height="3" fill="#E6B84D" />
    <rect x="3" y="8" width="10" height="3" fill="#E6B84D" />
    <rect x="2" y="11" width="12" height="3" fill="#E6B84D" />
    {/* Blank Bead Eyes */}
    <rect x="5" y="9" width="2" height="2" fill="#1C1917" />
    <rect x="9" y="9" width="2" height="2" fill="#1C1917" />
  </svg>
);

export const PixelHeart: React.FC<{ className?: string; filled?: boolean }> = ({
  className = 'w-5 h-5',
  filled = true,
}) => (
  <svg
    viewBox="0 0 12 11"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M2 1H5V2H7V1H10V2H11V6H10V7H9V8H8V9H7V10H5V9H4V8H3V7H2V6H1V2H2V1Z"
      fill={filled ? '#D95D39' : 'none'}
      stroke="#1C1917"
      strokeWidth="1"
    />
  </svg>
);

export const PixelStar: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-4 h-4',
  color = '#E6B84D',
}) => (
  <svg
    viewBox="0 0 9 9"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4" y="0" width="1" height="9" fill={color} />
    <rect x="0" y="4" width="9" height="1" fill={color} />
    <rect x="3" y="3" width="3" height="3" fill={color} />
    <rect x="4" y="4" width="1" height="1" fill="#1C1917" />
  </svg>
);

export const PixelCoin: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 10 10"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="1" width="6" height="8" fill="#E6B84D" />
    <rect x="1" y="2" width="8" height="6" fill="#E6B84D" />
    <rect x="4" y="3" width="2" height="4" fill="#1C1917" />
  </svg>
);

export const PixelSearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 12 12"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="1" width="5" height="1" fill="currentColor" />
    <rect x="2" y="7" width="5" height="1" fill="currentColor" />
    <rect x="1" y="2" width="1" height="5" fill="currentColor" />
    <rect x="7" y="2" width="1" height="5" fill="currentColor" />
    <rect x="7" y="7" width="2" height="2" fill="currentColor" />
    <rect x="9" y="9" width="2" height="2" fill="currentColor" />
  </svg>
);

export const PixelBagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 12 12"
    className={`crisp-edges ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4" y="1" width="4" height="1" fill="currentColor" />
    <rect x="3" y="2" width="1" height="2" fill="currentColor" />
    <rect x="8" y="2" width="1" height="2" fill="currentColor" />
    <rect x="1" y="4" width="10" height="7" fill="currentColor" />
    <rect x="3" y="6" width="2" height="2" fill="#F6F3EB" />
    <rect x="7" y="6" width="2" height="2" fill="#F6F3EB" />
  </svg>
);

export const PixelDivider: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div className="w-full py-4 flex items-center justify-center overflow-hidden select-none" aria-hidden="true">
    <div className="flex items-center gap-2 w-full max-w-7xl px-4">
      <div className={`h-[3px] flex-1 ${dark ? 'bg-[#F6F3EB]/30' : 'bg-[#1C1917]'}`} />
      <div className="flex items-center gap-1.5 px-2">
        <span className="w-2 h-2 bg-[#D95D39] inline-block" />
        <span className={`w-2 h-2 ${dark ? 'bg-[#F6F3EB]' : 'bg-[#1C1917]'} inline-block`} />
        <span className="w-2 h-2 bg-[#4A6B53] inline-block" />
        <span className={`w-2 h-2 ${dark ? 'bg-[#F6F3EB]' : 'bg-[#1C1917]'} inline-block`} />
        <span className="w-2 h-2 bg-[#E6B84D] inline-block" />
      </div>
      <div className={`h-[3px] flex-1 ${dark ? 'bg-[#F6F3EB]/30' : 'bg-[#1C1917]'}`} />
    </div>
  </div>
);

export const PixelImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}> = ({ src, alt, className = '', fallbackLabel }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EFECE2] text-[#1C1917] p-6 text-center select-none ${className}`}
      >
        <PixelCreatureSprite className="w-16 h-16 mb-3 animate-pixel-bounce" />
        <span className="font-pixel-display text-xs uppercase tracking-wider">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
};
