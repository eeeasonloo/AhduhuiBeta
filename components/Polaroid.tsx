
import React, { useState, useEffect } from 'react';
import { PolaroidData } from '../types';

interface PolaroidProps {
  data: PolaroidData;
  isPrinting: boolean;
  filter?: string;
}

const Polaroid: React.FC<PolaroidProps> = ({ data, isPrinting, filter }) => {
  const [developed, setDeveloped] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      setDeveloped(false);
      const timer = setTimeout(() => setDeveloped(true), 3500); // Develop after print animation
      return () => clearTimeout(timer);
    }
  }, [isPrinting, data.id]);

  // Combine default vintage look with optional user filter
  const imageStyle = {
    filter: `${filter || ''} sepia(0.2) contrast(1.1) saturate(1.1) brightness(1.02)`,
  };

  return (
    <div 
      className={`absolute top-[72%] w-[88%] max-w-[310px] z-10 flex flex-col items-center pointer-events-none ${isPrinting ? 'animate-print' : 'hidden'}`}
    >
      <div className="w-full bg-[#fdfdfd] p-3 pb-12 shadow-[0_45px_120px_-15px_rgba(0,0,0,0.95)] rounded-[3px] relative transform border border-gray-200 pointer-events-auto">
        <div className="aspect-[1/1] w-full bg-[#111] overflow-hidden relative border border-gray-200/50 shadow-inner">
          <img 
            alt="Printed Photo" 
            className={`w-full h-full object-cover transition-all duration-[4500ms] ease-in-out ${developed ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-2xl grayscale contrast-150 brightness-50'}`} 
            src={data.url} 
            style={imageStyle}
          />
          
          {/* Grain Texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>
          
          {/* Vintage Light Leak Effect */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-red-500/5 pointer-events-none transition-opacity duration-[5000ms] ${developed ? 'opacity-100' : 'opacity-0'}`}></div>
          
          {/* Film Edge Shadows */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none"></div>
          
          {/* Developing Stage Overlay */}
          <div className={`absolute inset-0 bg-[#1a1a1a] transition-opacity duration-[3500ms] ${developed ? 'opacity-0' : 'opacity-50'}`}></div>
        </div>
        
        {/* Date Label */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="text-gray-400 font-mono text-[10px] tracking-[0.25em] opacity-80 uppercase font-black italic">
            {data.date} • {data.label}
          </div>
        </div>

        {/* Realistic Glossy Surface */}
        <div className="absolute inset-3 bottom-12 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none opacity-40"></div>
      </div>
    </div>
  );
};

export default Polaroid;
