
import React, { useState } from 'react';

interface CustomizerProps {
  onClose: () => void;
  onSetAiPrompt: (prompt: string) => void;
  currentAiPrompt: string;
}

const Customizer: React.FC<CustomizerProps> = ({ 
  onClose, 
  onSetAiPrompt,
  currentAiPrompt 
}) => {
  const [tempAiPrompt, setTempAiPrompt] = useState(currentAiPrompt);

  const characterStyles = [
    { 
      name: 'Anime', 
      icon: 'auto_awesome',
      prompt: 'Transform the person into a high-quality 2D anime character. Keep the pose and hair color.' 
    },
    { 
      name: 'Zootopia', 
      icon: 'pets',
      prompt: 'Transform the person into a Zootopia-style anthropomorphic animal character. Maintain clothing style.' 
    },
    { 
      name: 'Pixar', 
      icon: 'animation',
      prompt: 'Transform the person into a 3D Pixar-style movie character with expressive large eyes and stylized features.' 
    },
    { 
      name: 'Cyberpunk', 
      icon: 'bolt',
      prompt: 'Transform the person into a futuristic cyberpunk character with neon highlights and tech-wear.' 
    },
    { 
      name: 'Sketch', 
      icon: 'edit',
      prompt: 'Transform the entire image into a detailed charcoal and pencil hand-drawn sketch.' 
    }
  ];

  const handleStyleClick = (prompt: string) => {
    if (tempAiPrompt === prompt) {
      setTempAiPrompt('');
    } else {
      setTempAiPrompt(prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#121212] rounded-t-[2.5rem] p-8 pb-12 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] border-t border-white/10 animate-in slide-in-from-bottom duration-500 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Lens Customizer</h2>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1">Multi-Pass Generation Active</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
        </div>

        <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Character Transformations */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-black mb-4 block">
              Magic Character Styles
            </label>
            <div className="grid grid-cols-2 gap-3">
              {characterStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => handleStyleClick(style.prompt)}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                    tempAiPrompt === style.prompt 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${tempAiPrompt === style.prompt ? 'text-indigo-400' : 'text-gray-600'}`}>
                    {style.icon}
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-black mb-4 block">
              Custom Prompt
            </label>
            <textarea 
              value={tempAiPrompt}
              onChange={(e) => setTempAiPrompt(e.target.value)}
              placeholder="e.g. As a retro superhero..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-20 placeholder:text-gray-700 font-medium"
            />
          </div>

          <div className="pt-4 sticky bottom-0 bg-[#121212] pb-2">
            <button
              onClick={() => {
                onSetAiPrompt(tempAiPrompt);
                onClose();
              }}
              className="w-full bg-pola-red text-white font-black text-[11px] tracking-[0.3em] py-5 rounded-2xl active:scale-95 transition-transform uppercase shadow-xl border-t border-white/20"
            >
              Configure Optics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customizer;
