
import React, { useState, useRef, useCallback } from 'react';
import { CameraStatus, PolaroidData } from './types';
import CameraLens from './components/CameraLens';
import Polaroid from './components/Polaroid';
import Customizer from './components/Customizer';
import { modifyImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [lastPolaroid, setLastPolaroid] = useState<PolaroidData | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const captureFrame = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const x = (video.videoWidth - size) / 2;
    const y = (video.videoHeight - size) / 2;
    
    ctx.drawImage(video, x, y, size, size, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  }, []);

  const triggerPrint = (imageUrl: string) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    
    const newPolaroid: PolaroidData = {
      id: Math.random().toString(36).substr(2, 9),
      url: imageUrl,
      date: formattedDate,
      label: aiPrompt ? 'MAGIC EDIT' : 'INSTANT',
      filterName: aiPrompt ? 'AI' : 'ANALOG'
    };
    
    setLastPolaroid(newPolaroid);
    setStatus(CameraStatus.PRINTING);
  };

  const handleCapture = async () => {
    if (status !== CameraStatus.IDLE) return;
    
    setStatus(CameraStatus.CAPTURING);
    // Mimic shutter delay
    await new Promise(r => setTimeout(r, 200));
    
    const rawImage = captureFrame();
    if (!rawImage) {
      setStatus(CameraStatus.ERROR);
      return;
    }

    if (aiPrompt) {
      const editedImage = await modifyImageWithAI(rawImage, aiPrompt);
      if (editedImage) {
        triggerPrint(editedImage);
      } else {
        triggerPrint(rawImage);
      }
    } else {
      triggerPrint(rawImage);
    }
  };

  const resetCamera = () => {
    setStatus(CameraStatus.IDLE);
    setLastPolaroid(null);
  };

  return (
    <div className="bg-[#080808] font-display antialiased h-[100dvh] w-full overflow-hidden select-none text-white flex flex-col items-center">
      <div className="w-full h-[3vh]"></div>

      {/* Branding - Smaller Logo and Name */}
      <div className="w-full flex flex-col items-center justify-center mb-4 pointer-events-none gap-2">
        <img 
          src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-zk8KwTWVtOiCNfuY7MhvuW6j8Bgxwf.png" 
          alt="Brand Logo" 
          className="h-16 w-auto object-contain animate-in fade-in zoom-in duration-700"
        />
        <span className="text-gray-500 font-display font-bold text-[10px] tracking-[0.3em] uppercase opacity-70">
          ahduhui's polaroid
        </span>
      </div>

      {/* Main Camera and Printing Container */}
      <div className="relative w-[90%] max-w-sm flex flex-col items-center">
        
        {/* Camera Body */}
        <div className="relative w-full aspect-[1/0.95] bg-[#fafafa] rounded-[2.5rem] shadow-camera-body border border-white/40 flex flex-col items-center z-20 plastic-texture overflow-visible">
          <div className="absolute top-0 w-full h-1/4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none rounded-t-[2.5rem]"></div>
          
          {/* Red Top Accent */}
          <div className="absolute top-0 left-[15%] w-12 h-4 bg-[#d62828] rounded-b-lg shadow-inner z-30"></div>
          
          {/* Rainbow Stripes */}
          <div className="absolute top-[28%] w-full flex justify-center z-10">
            <div className="h-4 w-2.5 bg-[#FFD400]"></div> 
            <div className="h-4 w-2.5 bg-[#F5821F]"></div> 
            <div className="h-4 w-2.5 bg-[#E4002B]"></div> 
            <div className="h-4 w-2.5 bg-[#009D4E]"></div> 
            <div className="h-4 w-2.5 bg-[#0058A8]"></div> 
          </div>

          {/* Viewfinder and Flash Mocks */}
          <div className="w-full flex justify-between items-start px-8 pt-8 mb-2 z-20">
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col p-1 shadow-md border border-gray-300/50">
              <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-[3px] relative overflow-hidden grid grid-cols-[repeat(10,1fr)] gap-[1px] content-center">
                <div className="col-span-10 h-full w-full bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:4px_100%]"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
              </div>
            </div>
            
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center shadow-md border border-gray-300/50 relative overflow-hidden">
              <div className="w-10 h-10 bg-[#050505] rounded shadow-inner flex items-center justify-center relative">
                <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${aiPrompt ? 'bg-indigo-400' : 'bg-emerald-500'} animate-led-blink`}></div>
              </div>
            </div>
          </div>

          <CameraLens videoRef={videoRef} isCapturing={status === CameraStatus.CAPTURING} />

          {/* Ejection Slot Area */}
          <div className="w-full px-8 pb-8 flex flex-col items-center relative z-20 mt-auto">
            <div className="w-full h-4 bg-[#111] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="w-[96%] h-[1.5px] bg-[#333] shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Printed Polaroid */}
        {lastPolaroid && (
          <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} />
        )}
      </div>

      {/* Controls - Compact Icons */}
      <div className="mt-auto w-full relative z-40 pb-10 pt-6 px-8 bg-gradient-to-t from-[#080808] via-[#080808] to-transparent">
        <div className="flex items-center justify-between w-full mb-6 px-2">
          
          {/* Customize Button (Smaller) */}
          <button 
            onClick={() => setIsCustomizing(true)}
            className="flex flex-col items-center gap-1.5 group transition-opacity"
          >
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md group-active:scale-90 transition-all ${aiPrompt ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10'}`}>
              <span className={`material-symbols-outlined text-[18px] ${aiPrompt ? 'text-indigo-400' : 'text-white'}`}>
                {aiPrompt ? 'magic_button' : 'tune'}
              </span>
            </div>
            <span className={`text-[8px] font-bold tracking-widest uppercase ${aiPrompt ? 'text-indigo-400' : 'text-white/40'}`}>
              {aiPrompt ? 'MAGIC' : 'STYLE'}
            </span>
          </button>

          {/* Shutter Button (Proportional) */}
          <button 
            onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
            className="relative group touch-manipulation mx-4"
          >
            <div className="absolute inset-0 bg-pola-red/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] border-[4px] group-active:scale-95 group-active:translate-y-1 transition-all ${status === CameraStatus.PRINTING ? 'bg-white border-gray-200' : 'bg-[#d62828] border-[#a01a1a]'}`}>
              <div className={`w-[54px] h-[54px] rounded-full border border-white/5 ${status === CameraStatus.PRINTING ? 'bg-black/5 flex items-center justify-center' : 'bg-gradient-to-br from-white/10 to-transparent'}`}>
                {status === CameraStatus.PRINTING ? (
                  <span className="material-symbols-outlined text-black/40 text-[20px]">refresh</span>
                ) : (
                  status === CameraStatus.CAPTURING && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )
                )}
              </div>
            </div>
          </button>

          {/* Gallery Mockup (Smaller) */}
          <button className="flex flex-col items-center gap-1.5 group opacity-40 hover:opacity-100 transition-opacity cursor-not-allowed">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-[18px]">photo_library</span>
            </div>
            <span className="text-[8px] text-white/40 font-bold tracking-widest uppercase">FILM</span>
          </button>
        </div>

        {/* Footer Rainbow Decor */}
        <div className="flex items-center justify-center gap-1.5 w-full opacity-60">
          <div className="h-1 w-1 rounded-full bg-[#FFD400]"></div>
          <div className="h-1 w-1 rounded-full bg-[#F5821F]"></div>
          <div className="h-1 w-1 rounded-full bg-[#E4002B]"></div>
          <div className="h-1 w-1 rounded-full bg-[#009D4E]"></div>
          <div className="h-1 w-1 rounded-full bg-[#0058A8]"></div>
        </div>
      </div>

      {/* Overlays */}
      {isCustomizing && (
        <Customizer 
          currentPrompt={aiPrompt}
          onSetPrompt={setAiPrompt}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </div>
  );
};

export default App;
