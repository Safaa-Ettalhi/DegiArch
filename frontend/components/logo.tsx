import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} ${className} flex items-center justify-center relative`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl blur-md opacity-60 animate-pulse"></div>
      <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* D - Design moderne avec effet 3D */}
          <rect x="18" y="18" width="10" height="64" rx="2" fill="white" opacity="0.95" />
          <path
            d="M28 18 L50 18 Q62 18 62 28 L62 50 Q62 62 50 62 L28 62"
            stroke="white"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            opacity="0.95"
          />
          {/* A - Design moderne */}
          <path
            d="M68 82 L76 52 L84 82"
            stroke="white"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          <line x1="72" y1="72" x2="80" y2="72" stroke="white" strokeWidth="9" strokeLinecap="round" opacity="0.95" />
        </svg>
      </div>
    </div>
  );
};

export default Logo;
