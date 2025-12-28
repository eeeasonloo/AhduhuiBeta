
import React, { useState, useEffect } from 'react';
import { PolaroidData } from '../types';

interface PolaroidProps {
  data: PolaroidData;
  isPrinting: boolean;
  caption: string;
  onCaptionChange: (val: string) => void;
}

const Polaroid: React.FC<PolaroidProps> = ({ data, isPrinting, caption, onCaptionChange }) => {
  const [developed, setDeveloped] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      setDeveloped(false);
      const timer = setTimeout(() => setDeveloped(true), 3500); 
      return () => clearTimeout(timer);
    }
  }, [isPrinting, data.id]);

  return (
    <div 
      className={`absolute top-[72%] w-[88%] max-w-[310px] z-10 flex flex-col items-center pointer-events-none ${isPrinting ? 'animate-print' : 'hidden'}`}
    >
      <div className="w-full bg-[#fdfdfd] p-3 pb-16 shadow-[0_45px_120px_-15px_rgba(0,0,0,0.95)] rounded-[3px] relative transform border border-gray-200 pointer-events-auto">
        <div className="aspect-[1/1] w-full bg-[#111] overflow-hidden relative border border-gray-200/50 shadow-inner">
          <img 
            alt="Printed Photo" 
            className={`w-full h-full object-cover transition-all duration-[4500ms] ease-in-out ${developed ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-2xl grayscale contrast-150 brightness-50'}`} 
            src={data.url} 
            style={{ filter: 'sepia(0.2) contrast(1.1) saturate(1.1) brightness(1.02)' }}
          />
          
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
          <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-red-500/5 pointer-events-none transition-opacity duration-[5000ms] ${developed ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none"></div>
          <div className={`absolute inset-0 bg-[#1a1a1a] transition-opacity duration-[3500ms] ${developed ? 'opacity-0' : 'opacity-50'}`}></div>
        </div>
        
        {/* Caption & Date Area */}
        <div className={`mt-4 px-1 flex flex-col items-center gap-1 transition-opacity duration-1000 ${developed ? 'opacity-100' : 'opacity-0'}`}>
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Write a note..."
            className="w-full bg-transparent border-none text-center text-gray-800 font-cute text-xl focus:ring-0 placeholder:text-gray-300 placeholder:opacity-50 transition-all"
          />
          <div className="text-gray-400 font-mono text-[8px] tracking-[0.2em] opacity-50 uppercase">
            {data.date} • {data.label}
          </div>
        </div>

        {/* Realistic Glossy Surface */}
        <div className="absolute inset-3 bottom-16 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none opacity-30"></div>
      </div>
    </div>
  );
};

export default Polaroid;
