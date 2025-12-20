
import React, { useState } from 'react';

interface CustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (prompt: string) => void;
  isProcessing: boolean;
}

const Customizer: React.FC<CustomizerProps> = ({ isOpen, onClose, onApply, isProcessing }) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#1a1a1b] rounded-3xl border border-white/10 p-6 shadow-2xl leather-texture">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-white/80">AI Lab</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] text-white/50 leading-relaxed">
            Re-imagine your last capture. Type a transformation (e.g., "Neon Tokyo night", "Vintage 70s look", "Watercolor painting").
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="How should Leica transform this?"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-leica-red min-h-[100px] resize-none"
          />

          <button
            onClick={() => onApply(prompt)}
            disabled={isProcessing || !prompt.trim()}
            className={`w-full py-4 rounded-full font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              isProcessing 
                ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                : 'bg-leica-red text-white hover:bg-red-700 shadow-lg'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Developing...
              </>
            ) : (
              'Reprint with AI'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Customizer;
