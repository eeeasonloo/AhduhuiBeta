
import React, { useState } from 'react';

interface CustomizerProps {
  onClose: () => void;
  onSetPrompt: (prompt: string) => void;
  currentPrompt: string;
}

const Customizer: React.FC<CustomizerProps> = ({ onClose, onSetPrompt, currentPrompt }) => {
  const [tempPrompt, setTempPrompt] = useState(currentPrompt);

  const presets = [
    { name: 'None', value: '' },
    { name: 'Vintage 70s', value: 'Make it look like a faded 1970s color photograph with warm tones and film grain' },
    { name: 'Cyberpunk', value: 'Add neon lights, futuristic city reflections, and vibrant magenta and cyan highlights' },
    { name: 'Watercolor', value: 'Transform the image into a soft watercolor painting with artistic brush strokes' },
    { name: 'Dreamy', value: 'Add a soft glow, light leaks, and a magical ethereal atmosphere' },
    { name: 'Sketch', value: 'Turn this into a detailed pencil sketch on textured paper' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-[#1a1a1a] rounded-t-[2.5rem] p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 animate-in slide-in-from-bottom duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">Magic Lens Settings</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3 block">
              Style Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setTempPrompt(p.value)}
                  className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border ${
                    tempPrompt === p.value 
                    ? 'bg-pola-red border-pola-red text-white' 
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3 block">
              Custom Instruction
            </label>
            <textarea
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="e.g., Make it look like a van gogh painting..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-1 focus:ring-pola-red focus:border-pola-red transition-all min-h-[100px] outline-none"
            />
          </div>

          <button
            onClick={() => {
              onSetPrompt(tempPrompt);
              onClose();
            }}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            APPLY MAGIC
          </button>
        </div>
      </div>
    </div>
  );
};

export default Customizer;
