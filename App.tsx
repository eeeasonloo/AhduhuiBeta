
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

  // Auto-scroll logic when printing
  useEffect(() => {
    if (status === CameraStatus.PRINTING && appContainerRef.current) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 800);
      return () => clearTimeout(timer);
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
    
    let label = 'INSTANT FILM';
    if (isGallery) label = 'GALLERY ARCHIVE';
    else if (currentAiPrompt.toLowerCase().includes('anime')) label = 'ANIME VARIANT';
    else if (currentAiPrompt.toLowerCase().includes('zootopia')) label = 'ZOOTOPIA CHAR';
    else if (currentAiPrompt.toLowerCase().includes('pixar')) label = 'PIXAR STUDIOS';
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
      setTimeout(() => setStatus(CameraStatus.IDLE), 2000);
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
      let processedImg = await captureFrame(base64);
      if (processedImg) {
        if (currentAiPrompt) {
          const aiImg = await modifyImageWithAI(processedImg, currentAiPrompt);
          if (aiImg) processedImg = aiImg;
        }
        triggerPrint(processedImg, true);
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
    <div ref={appContainerRef} className="bg-[#080808] font-display antialiased min-h-screen w-full overflow-y-auto overflow-x-hidden select-none text-white flex flex-col items-center">
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
           <span className="text-gray-600 font-display font-black text-[8px] tracking-[0.5em] uppercase">Nano-Banana Imaging</span>
           <div className="h-px w-8 bg-white/10"></div>
        </div>
      </div>

      {/* Main Camera Stage */}
      <div className="relative w-[92%] max-w-sm flex flex-col items-center flex-shrink-0">
        
        {/* Physical Shutter Button on Camera Top */}
        <button 
          onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
          className="absolute -top-4 right-10 z-[40] w-14 h-8 bg-black rounded-t-xl border-x border-t border-white/20 shadow-lg group transition-all active:translate-y-1 active:shadow-inner"
        >
          <div className={`absolute top-1 left-1 right-1 bottom-0 rounded-t-lg transition-colors ${status === CameraStatus.PRINTING ? 'bg-white' : (isMagicActive ? 'bg-indigo-600' : 'bg-pola-red')}`}></div>
          <div className="absolute inset-x-2 top-1 h-[1px] bg-white/20 rounded-full"></div>
        </button>

        {/* Camera Body */}
        <div className="relative w-full aspect-[1/0.95] bg-[#fafafa] rounded-[2.8rem] shadow-camera-body border border-white/40 flex flex-col items-center z-20 plastic-texture overflow-visible">
          
          {/* Vertical Rainbow Design */}
          <div className="absolute top-0 bottom-[40%] left-1/2 -translate-x-1/2 w-10 rainbow-stripe opacity-90 z-10"></div>
          
          {/* Top Shutter Accent Base */}
          <div className="absolute top-0 left-[15%] w-14 h-5 bg-[#d62828] rounded-b-xl shadow-inner z-30 flex items-center justify-center border-x border-b border-black/10">
             <div className="w-5 h-[1.5px] bg-white/30 rounded-full"></div>
          </div>
          
          {/* Integrated Body Buttons (Optics & Library) */}
          <div className="absolute top-24 left-6 z-30 flex flex-col gap-4">
             <button 
               onClick={() => setIsCustomizing(true)}
               className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all active:scale-90 ${isMagicActive ? 'bg-indigo-600 border-indigo-400' : 'bg-[#1a1a1a] border-white/10'}`}
             >
               <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
             </button>
             <button 
               onClick={handleGalleryClick}
               className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 shadow-md flex items-center justify-center transition-all active:scale-90"
             >
               <span className="material-symbols-outlined text-white text-[18px]">photo_library</span>
             </button>
          </div>

          <div className="w-full flex justify-between items-start px-8 pt-10 mb-2 z-20">
            {/* Viewfinder Area */}
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col p-1 shadow-md border border-gray-300/50">
              <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-[3px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:4px_100%]"></div>
              </div>
            </div>
            
            {/* Flash / Status Area */}
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
            <div className="mt-2 text-[7px] font-black text-gray-400 tracking-[0.4em] uppercase opacity-40">Film Slot Output</div>
          </div>
        </div>

        {/* Printed Polaroid */}
        {lastPolaroid && (
          <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} />
        )}
      </div>

      {/* Spacer that grows when photo is printed */}
      <div className={`transition-all duration-1000 ease-in-out ${status === CameraStatus.PRINTING ? 'h-[460px]' : 'h-0'}`}></div>

      {/* Controls Container - Secondary UI below camera */}
      <div className="w-full max-w-sm px-6 my-12 z-30 pb-12 flex justify-center">
          {/* Main Large Shutter Button */}
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
