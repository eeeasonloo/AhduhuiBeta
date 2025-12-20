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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic when printing to show the ejected photo
  useEffect(() => {
    if (status === CameraStatus.PRINTING && appContainerRef.current) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

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
        img.onerror = () => resolve(null);
        img.src = externalSrc;
      } else if (videoRef.current) {
        const video = videoRef.current;
        if (video.videoWidth === 0) return resolve(null);
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
    setErrorMsg(null);
    
    await new Promise(r => setTimeout(r, 150));
    
    let imgData = await captureFrame();
    if (!imgData) {
      setErrorMsg("Unable to access camera frame. Check permissions.");
      setStatus(CameraStatus.IDLE);
      return;
    }

    if (currentAiPrompt) {
      try {
        const aiImg = await modifyImageWithAI(imgData, currentAiPrompt);
        if (aiImg) {
          imgData = aiImg;
        } else {
          setErrorMsg("AI transformation failed. This could be due to safety filters or free-tier rate limits. Falling back to original photo.");
        }
      } catch (err: any) {
        setErrorMsg(`AI processing error: ${err.message || 'Unknown error'}`);
      }
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
      setErrorMsg(null);
      
      let processedImg = await captureFrame(base64);
      if (processedImg) {
        if (currentAiPrompt) {
          try {
            const aiImg = await modifyImageWithAI(processedImg, currentAiPrompt);
            if (aiImg) {
              processedImg = aiImg;
            } else {
              setErrorMsg("AI transformation failed. This could be due to safety filters or rate limits. Falling back to original photo.");
            }
          } catch (err: any) {
            setErrorMsg(`AI processing error: ${err.message || 'Unknown error'}`);
          }
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
    setErrorMsg(null);
  };

  const isMagicActive = currentAiPrompt !== '';

  return (
    <div ref={appContainerRef} className="bg-[#080808] font-display antialiased min-h-screen w-full overflow-y-auto overflow-x-hidden select-none text-white flex flex-col items-center">
      
      {/* Error Message Toast */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0">error</span>
            <div className="flex-1">
              <p className="text-[10px] font-black tracking-widest text-red-500 uppercase mb-1">Warning</p>
              <p className="text-[11px] font-medium text-gray-300 leading-tight">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-gray-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

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
        
        {/* Physical Shutter Button on Camera Top - Right Side */}
        <button 
          disabled={status === CameraStatus.CAPTURING}
          onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
          className="absolute -top-4 right-10 z-[40] w-14 h-8 bg-black rounded-t-xl border-x border-t border-white/20 shadow-lg group transition-all active:translate-y-1 active:shadow-inner"
        >
          <div className={`absolute top-1 left-1 right-1 bottom-0 rounded-t-lg transition-colors flex items-center justify-center ${status === CameraStatus.PRINTING ? 'bg-white' : (isMagicActive ? 'bg-indigo-600' : 'bg-pola-red')}`}>
            {status === CameraStatus.CAPTURING && (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            )}
            {status === CameraStatus.PRINTING && (
              <span className="material-symbols-outlined text-black text-xs">refresh</span>
            )}
          </div>
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
          
          {/* Side Buttons (Optics & Library) - Centered Left Middle */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 z-30 flex flex-col gap-4">
             <button 
               onClick={() => setIsCustomizing(true)}
               className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all active:scale-90 ${isMagicActive ? 'bg-indigo-600 border-indigo-400' : 'bg-[#1a1a1a] border-white/10'}`}
               title="Customizer"
             >
               <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
             </button>
             <button 
               onClick={handleGalleryClick}
               className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 shadow-md flex items-center justify-center transition-all active:scale-90"
               title="Gallery"
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
                <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,1)] ${isMagicActive ? 'bg-indigo-500 shadow-indigo-500/50' : (status === CameraStatus.CAPTURING ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50')} animate-led-blink transition-colors duration-500`}></div>
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
      <div className={`transition-all duration-1000 ease-in-out ${status === CameraStatus.PRINTING ? 'h-[460px]' : 'h-12'}`}></div>

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