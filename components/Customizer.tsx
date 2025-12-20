import React, { useState } from 'react';

interface CustomizerProps {
  onClose: () => void;
  onSetFilter: (filter: string) => void;
  currentFilter: string;
}

const Customizer: React.FC<CustomizerProps> = ({ onClose, onSetFilter, currentFilter }) => {
  const [tempFilter, setTempFilter] = useState(currentFilter);

  const filterPresets = [
    { name: 'None', value: 'none' },
    { name: 'Vintage', value: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
    { name: 'B&W', value: 'grayscale(1) contrast(1.2)' },
    { name: 'Vibrant', value: 'saturate(1.8) contrast(1.1)' },
    { name: 'Dreamy', value: 'brightness(1.1) saturate(0.8) blur(0.5px)' },
    { name: 'Cold', value: 'hue-rotate(180deg) saturate(0.5) brightness(1.1)' },
    { name: 'Warm', value: 'sepia(0.3) saturate(1.4) contrast(0.9)' },
    { name: 'Noir', value: 'grayscale(1) contrast(2) brightness(0.7)' },
    { name: 'Retro', value: 'sepia(0.4) hue-rotate(-30deg) contrast(1.2)' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#1a1a1a] rounded-t-[2.5rem] p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 animate-in slide-in-from-bottom duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-white">Lens Filters</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Local Analog Emulation</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4 block">
              Analog Presets
            </label>
            <div className="grid grid-cols-3 gap-3">
              {filterPresets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setTempFilter(p.value)}
                  className={`py-3 px-2 rounded-xl text-[11px] font-bold tracking-tight transition-all border ${
                    tempFilter === p.value 
                    ? 'bg-pola-red border-pola-red text-white shadow-[0_0_15px_rgba(228,0,43,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onSetFilter(tempFilter);
                onClose();
              }}
              className="w-full bg-white text-black font-black text-xs tracking-[0.2em] py-5 rounded-2xl active:scale-95 transition-transform uppercase"
            >
              Apply to Next Shot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customizer;