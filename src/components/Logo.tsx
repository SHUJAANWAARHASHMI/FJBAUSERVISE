import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  iconSize?: number;
}

export default function Logo({ variant = 'full', className = '', iconSize = 48 }: LogoProps) {
  // SVG of the custom wrecking ball smashing brick wall logo
  const iconSvg = (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 200 130" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* 1. SPEED / IMPACT LINES DEBRIS (Black) */}
      <path d="M 68 44 L 74 36 L 77 41 Z" fill="currentColor" className="text-text-main" />
      <path d="M 58 34 L 60 24 L 65 27 Z" fill="currentColor" className="text-text-main" />
      <path d="M 82 35 L 91 30 L 88 37 Z" fill="currentColor" className="text-text-main" />

      {/* 2. CRANE ARM / ROD (Orange) */}
      <path d="M 37 18 L 65 72 L 58 75 L 30 21 Z" fill="#ff751f" />
      <circle cx="48" cy="45" r="7" stroke="#ff751f" strokeWidth="4.5" fill="none" />

      {/* 3. STAGGERED BRICK PYRAMID */}
      {/* Top Tilted Orange Brick */}
      <rect x="110" y="42" width="32" height="14" rx="1.5" transform="rotate(-15 110 42)" fill="#ff751f" />
      
      {/* Middle Row Orange Brick */}
      <rect x="94" y="58" width="32" height="14" rx="1.5" fill="#ff751f" />
      {/* Middle Row Black Brick */}
      <rect x="128" y="58" width="22" height="14" rx="1.5" fill="currentColor" className="text-text-main" />
      
      {/* Bottom Tilted/Impact Black Brick */}
      <rect x="91" y="75" width="24" height="14" rx="1.5" transform="rotate(10 91 75)" fill="currentColor" className="text-text-main" />

      {/* Bottom Row Bricks */}
      <rect x="92" y="93" width="32" height="14" rx="1.5" transform="rotate(-8 92 93)" fill="currentColor" className="text-text-main" />
      <rect x="127" y="92" width="32" height="14" rx="1.5" fill="#ff751f" />
      <rect x="162" y="92" width="24" height="14" rx="1.5" fill="currentColor" className="text-text-main" />

      {/* 4. ORANGE WRECKING BALL */}
      <circle cx="60" cy="80" r="30" fill="#ff751f" />
      {/* Wrecking Ball Inner Reflective White Highlight */}
      <path d="M 38 65 A 25 25 0 0 0 54 102 A 22 22 0 0 1 38 65" fill="#ffffff" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3.5 md:gap-4 select-none shrink-0 whitespace-nowrap ${className}`}>
      {iconSvg}
      <div className="flex flex-col text-left shrink-0">
        <div className="text-xl md:text-2xl font-black tracking-tight text-text-main font-sans flex items-baseline leading-none whitespace-nowrap">
          <span className="font-extrabold uppercase">FJ</span>
          <span className="font-medium lowercase first-letter:uppercase ml-1.5 opacity-90 text-text-main">Bauservice</span>
        </div>
        <div className="text-[10px] md:text-xs tracking-[0.06em] font-bold text-text-muted mt-1 uppercase leading-none whitespace-nowrap">
          Raum für Neues schaffen
        </div>
      </div>
    </div>
  );
}
