
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraStatus, PolaroidData } from './types';
import CameraLens from './components/CameraLens';
import Polaroid from './components/Polaroid';
import Customizer from './components/Customizer';
import { modifyImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [lastPolaroid, setLastPolaroid] = useState<PolaroidData | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('none');
  const [currentAiPrompt, setCurrentAiPrompt] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to printed photo
  useEffect(() => {
    if (status === CameraStatus.PRINTING && appContainerRef.current) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    }
  }, [status]);

  const captureFrame = useCallback(async (externalSrc?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const finalizeCanvas = (img: HTMLImageElement | HTMLVideoElement, w: number, h: number) => {
        const size = Math.min(w, h);
        canvas.width = 1000; 
        canvas.height = 1000;
        
        ctx.clearRect(0, 0, 1000, 1000);
        ctx.filter = currentFilter;
        
        const x = (w - size) / 2;
        const y = (h - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 1000, 1000);
        ctx.filter = 'none';
        
        resolve(canvas.toDataURL('image/png'));
      };

      if (externalSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => finalizeCanvas(img, img.width, img.height);
        img.src = externalSrc;
      } else if (videoRef.current) {
        const video = videoRef.current;
        finalizeCanvas(video, video.videoWidth, video.videoHeight);
      } else {
        resolve(null);
      }
    });
  }, [currentFilter]);

  const triggerPrint = (imageUrl: string, isGallery: boolean = false) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    
    // Determine the style label based on the active transformation
    let label = 'INSTANT FILM';
    if (isGallery) label = 'GALLERY ARCHIVE';
    else if (currentAiPrompt.includes('Anime')) label = 'ANIME VARIANT';
    else if (currentAiPrompt.includes('Zootopia')) label = 'ZOOTOPIA CHARACTER';
    else if (currentAiPrompt.includes('Pixar')) label = 'PIXAR STUDIOS';
    else if (currentAiPrompt) label = 'MAGIC GEN';
    else if (currentFilter !== 'none') label = 'OPTIC FX';
    
    const newPolaroid: PolaroidData = {
      id: Math.random().toString(36).substr(2, 9),
      url: imageUrl,
      date: formattedDate,
      label: label,
      filterName: currentFilter === 'none' ? 'NATURAL' : 'GLASS-FX'
    };
    
    setLastPolaroid(newPolaroid);
    setStatus(CameraStatus.PRINTING);
  };

  const handleCapture = async () => {
    if (status !== CameraStatus.IDLE) return;
    
    setStatus(CameraStatus.CAPTURING);
    await new Promise(r => setTimeout(r, 200));
    
    let imgData = await captureFrame();
    if (!imgData) {
      setStatus(CameraStatus.ERROR);
      return;
    }

    if (currentAiPrompt) {
      const aiImg = await modifyImageWithAI(imgData, currentAiPrompt);
      if (aiImg) imgData = aiImg;
    }

    triggerPrint(imgData);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setStatus(CameraStatus.CAPTURING);
      let filteredImg = await captureFrame(base64);
      
      if (filteredImg) {
        if (currentAiPrompt) {
          const aiImg = await modifyImageWithAI(filteredImg, currentAiPrompt);
          if (aiImg) filteredImg = aiImg;
        }
        triggerPrint(filteredImg, true);
      } else {
        setStatus(CameraStatus.IDLE);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resetCamera = () => {
    setStatus(CameraStatus.IDLE);
    setLastPolaroid(null);
  };

  const isMagicActive = currentAiPrompt !== '';

  return (
    <div ref={appContainerRef} className="bg-[#080808] font-display antialiased min-h-screen w-full overflow-y-auto overflow-x-hidden select-none text-white flex flex-col items-center pb-32">
      <div className="w-full h-[4vh]"></div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Branding */}
      <div className="w-full flex flex-col items-center justify-center mb-6 pointer-events-none gap-2">
        <img 
          src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-zk8KwTWVtOiCNfuY7MhvuW6j8Bgxwf.png" 
          alt="Brand Logo" 
          className="h-12 w-auto object-contain animate-in fade-in duration-1000"
        />
        <div className="flex items-center gap-3">
           <div className="h-px w-8 bg-white/10"></div>
           <span className="text-gray-600 font-display font-black text-[8px] tracking-[0.5em] uppercase">Digital Analog System</span>
           <div className="h-px w-8 bg-white/10"></div>
        </div>
      </div>

      <div className="relative w-[92%] max-w-sm flex flex-col items-center">
        {/* Camera Body */}
        <div className="relative w-full aspect-[1/0.95] bg-[#fafafa] rounded-[2.8rem] shadow-camera-body border border-white/40 flex flex-col items-center z-20 plastic-texture overflow-visible transition-all duration-500">
          <div className="absolute top-0 w-full h-1/4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none rounded-t-[2.8rem]"></div>
          
          <div className="absolute top-0 left-[15%] w-14 h-5 bg-[#d62828] rounded-b-xl shadow-inner z-30 flex items-center justify-center border-x border-b border-black/10">
             <div className="w-5 h-[1.5px] bg-white/30 rounded-full"></div>
          </div>
          
          <div className="absolute top-[28%] w-full flex justify-center z-10 scale-75 opacity-80">
            <div className="h-4 w-2.5 bg-[#FFD400]"></div> 
            <div className="h-4 w-2.5 bg-[#F5821F]"></div> 
            <div className="h-4 w-2.5 bg-[#E4002B]"></div> 
            <div className="h-4 w-2.5 bg-[#009D4E]"></div> 
            <div className="h-4 w-2.5 bg-[#0058A8]"></div> 
          </div>

          <div className="w-full flex justify-between items-start px-8 pt-10 mb-2 z-20">
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col p-1 shadow-md border border-gray-300/50">
              <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-[3px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:4px_100%]"></div>
              </div>
            </div>
            
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center shadow-md border border-gray-300/50 relative overflow-hidden">
              <div className="w-10 h-10 bg-[#050505] rounded shadow-inner flex items-center justify-center relative">
                <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,1)] ${isMagicActive ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} animate-led-blink transition-colors duration-500`}></div>
                <span className={`material-symbols-outlined text-xs transition-colors duration-500 ${isMagicActive ? 'text-indigo-400 opacity-60' : 'text-white/10'}`}>
                  {isMagicActive ? 'psychology' : 'bolt'}
                </span>
              </div>
            </div>
          </div>

          <CameraLens 
            videoRef={videoRef} 
            isCapturing={status === CameraStatus.CAPTURING} 
            currentFilter={currentFilter}
          />

          <div className="w-full px-10 pb-10 flex flex-col items-center relative z-20 mt-auto">
            <div className="w-full h-6 bg-[#111] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="w-[98%] h-[2px] bg-[#333] shadow-inner"></div>
            </div>
            <div className="mt-2 text-[7px] font-black text-gray-400 tracking-[0.4em] uppercase opacity-40">High Fidelity Ejector</div>
          </div>
        </div>

        {/* Printed Polaroid */}
        {lastPolaroid && (
          <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} />
        )}
      </div>

      {/* Controls Container */}
      <div className={`w-full max-w-sm px-6 mt-16 z-30 transition-all duration-700 ${status === CameraStatus.PRINTING ? 'translate-y-32 opacity-100' : 'translate-y-0'}`}>
        <div className="flex items-center justify-between w-full px-4">
          
          {/* Magic Customizer Button */}
          <button 
            onClick={() => setIsCustomizing(true)}
            className="flex flex-col items-center gap-3 group transition-all"
          >
            <div className={`w-14 h-14 rounded-full border flex items-center justify-center backdrop-blur-xl group-active:scale-90 transition-all duration-500 ${isMagicActive ? 'bg-indigo-600/30 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10'}`}>
              <span className={`material-symbols-outlined text-[24px] transition-all duration-500 ${isMagicActive ? 'text-indigo-300 scale-110' : 'text-white/80'}`}>
                {isMagicActive ? 'auto_awesome' : 'filter_frames'}
              </span>
            </div>
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-500 ${isMagicActive ? 'text-indigo-400' : 'text-white/30'}`}>
              {isMagicActive ? 'Magic On' : 'Optics'}
            </span>
          </button>

          {/* Shutter Button */}
          <button 
            onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
            className="relative group touch-manipulation"
          >
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${isMagicActive ? 'bg-indigo-600/30' : 'bg-pola-red/20'}`}></div>
            <div className={`w-[90px] h-[90px] rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] border-[6px] group-active:scale-95 transition-all duration-300 ${status === CameraStatus.PRINTING ? 'bg-white border-gray-200' : (isMagicActive ? 'bg-indigo-600 border-indigo-800' : 'bg-[#d62828] border-[#a01a1a]')}`}>
              <div className={`w-[66px] h-[66px] rounded-full flex items-center justify-center ${status === CameraStatus.PRINTING ? 'bg-black/5' : 'bg-gradient-to-br from-white/10 to-transparent shadow-inner'}`}>
                {status === CameraStatus.PRINTING ? (
                  <span className="material-symbols-outlined text-black/60 text-[28px]">refresh</span>
                ) : (
                  status === CameraStatus.CAPTURING ? (
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/5 to-transparent"></div>
                  )
                )}
              </div>
            </div>
          </button>

          {/* Film Gallery Button */}
          <button 
            onClick={handleGalleryClick}
            className="flex flex-col items-center gap-3 group transition-all"
          >
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-xl group-active:scale-90">
              <span className="material-symbols-outlined text-white/80 text-[24px]">add_photo_alternate</span>
            </div>
            <span className="text-[9px] text-white/30 font-black tracking-[0.2em] uppercase">Library</span>
          </button>
        </div>
      </div>

      {isCustomizing && (
        <Customizer 
          currentFilter={currentFilter}
          currentAiPrompt={currentAiPrompt}
          onSetFilter={setCurrentFilter}
          onSetAiPrompt={setCurrentAiPrompt}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </div>
  );
};

export default App;
