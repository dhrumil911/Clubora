import React from 'react';

export default function CluboraLogoIcon({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cluboraOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5500" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
        <linearGradient id="cluboraDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7700" />
          <stop offset="50%" stopColor="#3b4158" />
          <stop offset="100%" stopColor="#1e2230" />
        </linearGradient>
      </defs>

      {/* Left Outer Ring */}
      <circle cx="34" cy="30" r="23" stroke="url(#cluboraOrange)" strokeWidth="4.5" />
      {/* Left Inner Ring */}
      <circle cx="34" cy="30" r="15" stroke="url(#cluboraOrange)" strokeWidth="4" />

      {/* Right Outer Ring */}
      <circle cx="66" cy="30" r="23" stroke="url(#cluboraDark)" strokeWidth="4.5" />
      {/* Right Inner Ring */}
      <circle cx="66" cy="30" r="15" stroke="url(#cluboraDark)" strokeWidth="4" />

      {/* Interlocking Arc Overlap for 3D Weave Effect */}
      <path
        d="M 44.5 12.5 A 23 23 0 0 1 55.5 47.5"
        stroke="url(#cluboraOrange)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 44.5 18 A 15 15 0 0 1 51.5 42"
        stroke="url(#cluboraOrange)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
