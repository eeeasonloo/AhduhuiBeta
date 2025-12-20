
import React from 'react';
import { PolaroidData } from '../types';

interface PolaroidProps {
  data: PolaroidData;
  isPrinting: boolean;
}

const Polaroid: React.FC<PolaroidProps> = ({ data, isPrinting }) => {
  return (
    <div className={`absolute top-[36%] w-[72%] max-w-[280px] z-10 flex flex-col items-center ${isPrinting ? 'animate-print' : 'hidden'}`}>
      <div className="w-full bg-white p-3 pb-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] rounded-[2px] relative transform">
        <div className="aspect-[4/5] w-full bg-gray-100 overflow-hidden relative grayscale-[15%] contrast-110">
          <img 
            alt="Printed Photo" 
            className="w-full h-full object-cover" 
            src={data.url} 
          />
          <div className="absolute inset-0 bg-orange-900/5 mix-blend-multiply pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
        </div>
        
        <div className="pt-3 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5 opacity-90">
            <span className="text-black font-display font-bold text-[10px] tracking-widest uppercase">Leica</span>
            <div className="w-1 h-1 rounded-full bg-[#D20000]"></div>
            <span className="text-black/60 font-mono font-medium text-[9px] uppercase">Sofort</span>
          </div>
          <div className="text-gray-400 font-mono text-[8px] tracking-wider mt-1 uppercase">
            {data.date} • {data.filterName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Polaroid;
