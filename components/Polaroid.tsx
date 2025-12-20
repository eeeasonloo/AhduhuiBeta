
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
      const timer = setTimeout(() => setDeveloped(true), 3500); // Develop after print animation
      return () => clearTimeout(timer);
    }
  }, [isPrinting, data.id]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        const response = await fetch(data.url);
        const blob = await response.blob();
        const file = new File([blob], `polaroid-${data.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'My Ahduhui Polaroid',
          text: `Captured on ${data.date} with ${data.label}`,
          files: [file],
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `polaroid-${data.id}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div 
      className={`absolute top-[72%] w-[88%] max-w-[310px] z-10 flex flex-col items-center pointer-events-none ${isPrinting ? 'animate-print' : 'hidden'}`}
    >
      <div className="w-full bg-[#fdfdfd] p-3 pb-12 shadow-[0_45px_120px_-15px_rgba(0,0,0,0.95)] rounded-[3px] relative transform border border-gray-200 pointer-events-auto">
        <div className="aspect-[1/1] w-full bg-[#111] overflow-hidden relative border border-gray-200/50 shadow-inner">
          <img 
            alt="Printed Photo" 
            className={`w-full h-full object-cover transition-all duration-[4500ms] ease-in-out ${developed ? 'opacity-100 scale-100 grayscale-0 contrast-110 brightness-100' : 'opacity-0 scale-110 blur-2xl grayscale contrast-150 brightness-50'}`} 
            src={data.url} 
          />
          
          {/* Film Texture Overlays */}
          <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Developing Stage Overlay */}
          <div className={`absolute inset-0 bg-[#1a1a1a] transition-opacity duration-[3500ms] ${developed ? 'opacity-0' : 'opacity-50'}`}></div>

          {/* Share/Save Button */}
          <button 
            onClick={handleShare}
            className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-white/95 shadow-xl flex items-center justify-center transition-all duration-700 hover:scale-110 active:scale-90 ${developed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
          >
            <span className="material-symbols-outlined text-black text-2xl">ios_share</span>
          </button>
        </div>
        
        {/* Date Label */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="text-gray-400 font-mono text-[10px] tracking-[0.25em] opacity-80 uppercase font-black italic">
            {data.date} • {data.label}
          </div>
        </div>

        {/* Realistic Glossy Surface */}
        <div className="absolute inset-3 bottom-12 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none opacity-60"></div>
      </div>
    </div>
  );
};

export default Polaroid;
