import React, { useState, useEffect } from 'react';
import { PolaroidData } from '../types';

interface PolaroidProps {
  data: PolaroidData;
  isPrinting: boolean;
}

const Polaroid: React.FC<PolaroidProps> = ({ data, isPrinting }) => {
  const [developed, setDeveloped] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      setDeveloped(false);
      const timer = setTimeout(() => setDeveloped(true), 3000); // Develop after print animation
      return () => clearTimeout(timer);
    }
  }, [isPrinting, data.id]);

  return (
    <div 
      className={`absolute top-[68%] w-[82%] max-w-[300px] z-10 flex flex-col items-center pointer-events-none ${isPrinting ? 'animate-print' : 'hidden'}`}
    >
      <div className="w-full bg-[#fcfcfc] p-3 pb-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] rounded-[2px] relative transform border border-gray-200">
        <div className="aspect-[1/1] w-full bg-[#111] overflow-hidden relative border border-gray-200/50">
          <img 
            alt="Printed Photo" 
            className={`w-full h-full object-cover transition-all duration-[4000ms] ease-in-out ${developed ? 'opacity-100 scale-100 grayscale-0 contrast-110 brightness-100' : 'opacity-0 scale-105 blur-xl grayscale contrast-150 brightness-50'}`} 
            src={data.url} 
          />
          
          {/* Film Texture Overlays */}
          <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Developing Stage Overlay */}
          <div className={`absolute inset-0 bg-[#222] transition-opacity duration-[3000ms] ${developed ? 'opacity-0' : 'opacity-40'}`}></div>
        </div>
        
        {/* Date Label with Handwriting Style */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="text-gray-400 font-mono text-[10px] tracking-[0.1em] opacity-80 italic">
            {data.date} • {data.label}
          </div>
        </div>

        {/* Glossy Reflection */}
        <div className="absolute top-3 left-3 right-3 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-40"></div>
      </div>
    </div>
  );
};

export default Polaroid;