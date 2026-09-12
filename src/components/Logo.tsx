import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const LogoIcon: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="CrowdfundX Logo Mark"
    >
      {/* Outer open circle */}
      <path
        d="M 89.5 35.6 A 42 42 0 1 1 57.3 8.6"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner CX Graphic */}
      {/* The C */}
      <path
        d="M 55 31 A 16 16 0 1 0 55 61"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Backslash of X */}
      <path
        d="M 55 31 L 77 61"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Slash of X ending in arrow */}
      <path
        d="M 49 61 L 81 21"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow Head */}
      <polygon
        points="86,13 68,17 82,31"
        fill="white"
      />

      {/* Three People silhouettes */}
      {/* Left Person */}
      <circle cx="42" cy="78" r="2.5" fill="#a3a3a3" />
      <path d="M 37 88 C 37 83, 47 83, 47 88 Z" fill="#a3a3a3" />

      {/* Right Person */}
      <circle cx="58" cy="78" r="2.5" fill="#a3a3a3" />
      <path d="M 53 88 C 53 83, 63 83, 63 88 Z" fill="#a3a3a3" />

      {/* Center Person */}
      <circle cx="50" cy="74" r="3.5" fill="#e4e2e2" />
      <path d="M 43 88 C 43 81, 57 81, 57 88 Z" fill="#e4e2e2" />
    </svg>
  );
};

export const LogoFull: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <LogoIcon size={128} className="mb-6 hover:scale-105 transition-transform duration-300 ease-out" />
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white font-headline-lg">
        Crowdfund<span className="text-[#84cc16]">X</span>
      </h1>
      <div className="flex items-center gap-3 mt-4 text-xs md:text-sm font-semibold tracking-[0.25em] text-[#a3a3a3] uppercase">
        <span className="w-8 h-[2px] bg-[#84cc16] rounded-full"></span>
        <span>Fund Together. Grow Together.</span>
        <span className="w-8 h-[2px] bg-[#84cc16] rounded-full"></span>
      </div>
    </div>
  );
};
