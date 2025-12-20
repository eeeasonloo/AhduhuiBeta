import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraStatus, PolaroidData } from './types';
import CameraLens from './components/CameraLens';
import Polaroid from './components/Polaroid';
import Customizer from './components/Customizer';

const App: React.FC = () => {
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [lastPolaroid, setLastPolaroid] = useState<PolaroidData | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('none');
  
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const captureFrame = useCallback((externalSrc?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      if (externalSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          canvas.width = 1000; // High quality fixed size for polaroid
          canvas.height = 1000;
          
          ctx.clearRect(0, 0, 1000, 1000);
          ctx.filter = currentFilter;
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 1000, 1000);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = externalSrc;
      } else {
        if (!videoRef.current) return resolve(null);
        const video = videoRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 1000;
        canvas.height = 1000;
        
        ctx.clearRect(0, 0, 1000, 1000);
        ctx.filter = currentFilter;
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        ctx.drawImage(video, x, y, size, size, 0, 0, 1000, 1000);
        resolve(canvas.toDataURL('image/png'));
      }
    });
  }, [currentFilter]);

  const triggerPrint = (imageUrl: string, isGallery: boolean = false) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    
    const newPolaroid: PolaroidData = {
      id: Math.random().toString(36).substr(2, 9),
      url: imageUrl,
      date: formattedDate,
      label: isGallery ? 'GALLERY FILM' : (currentFilter !== 'none' ? 'FILTERED' : 'INSTANT'),
      filterName: currentFilter === 'none' ? 'ANALOG' : 'LENS-FX'
    };
    
    setLastPolaroid(newPolaroid);
    setStatus(CameraStatus.PRINTING);
  };

  const handleCapture = async () => {
    if (status !== CameraStatus.IDLE) return;
    
    setStatus(CameraStatus.CAPTURING);
    // Mimic shutter delay
    await new Promise(r => setTimeout(r, 150));
    
    const imgData = await captureFrame();
    if (!imgData) {
      setStatus(CameraStatus.ERROR);
      return;
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
      const filteredImg = await captureFrame(base64);
      if (filteredImg) {
        triggerPrint(filteredImg, true);
      } else {
        setStatus(CameraStatus.IDLE);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const resetCamera = () => {
    setStatus(CameraStatus.IDLE);
    setLastPolaroid(null);
  };

  return (
    <div ref={appContainerRef} className="bg-[#080808] font-display antialiased min-h-screen w-full overflow-y-auto overflow-x-hidden select-none text-white flex flex-col items-center pb-32">
      <div className="w-full h-[4vh]"></div>

      {/* Hidden File Input for Gallery */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Branding */}
      <div className="w-full flex flex-col items-center justify-center mb-6 pointer-events-none gap-2">
        <img 
          src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-zk8KwTWVtOiCNfuY7MhvuW6j8Bgxwf.png" 
          alt="Brand Logo" 
          className="h-14 w-auto object-contain animate-in fade-in zoom-in duration-700"
        />
        <span className="text-gray-600 font-display font-black text-[9px] tracking-[0.4em] uppercase opacity-60">
          premium instant optics
        </span>
      </div>

      {/* Main Camera and Printing Container */}
      <div className="relative w-[92%] max-w-sm flex flex-col items-center mb-12">
        
        {/* Camera Body */}
        <div className="relative w-full aspect-[1/0.95] bg-[#fafafa] rounded-[2.8rem] shadow-camera-body border border-white/40 flex flex-col items-center z-20 plastic-texture overflow-visible">
          <div className="absolute top-0 w-full h-1/4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none rounded-t-[2.8rem]"></div>
          
          {/* Red Top Accent */}
          <div className="absolute top-0 left-[15%] w-14 h-5 bg-[#d62828] rounded-b-xl shadow-inner z-30 flex items-center justify-center">
             <div className="w-6 h-[1px] bg-white/20"></div>
          </div>
          
          {/* Rainbow Stripes */}
          <div className="absolute top-[28%] w-full flex justify-center z-10">
            <div className="h-4 w-2.5 bg-[#FFD400]"></div> 
            <div className="h-4 w-2.5 bg-[#F5821F]"></div> 
            <div className="h-4 w-2.5 bg-[#E4002B]"></div> 
            <div className="h-4 w-2.5 bg-[#009D4E]"></div> 
            <div className="h-4 w-2.5 bg-[#0058A8]"></div> 
          </div>

          {/* Viewfinder and Flash Mocks */}
          <div className="w-full flex justify-between items-start px-8 pt-10 mb-2 z-20">
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col p-1 shadow-md border border-gray-300/50">
              <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-[3px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:4px_100%] opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
              </div>
            </div>
            
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center shadow-md border border-gray-300/50 relative overflow-hidden">
              <div className="w-10 h-10 bg-[#050505] rounded shadow-inner flex items-center justify-center relative">
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${currentFilter !== 'none' ? 'bg-indigo-400' : 'bg-emerald-500'} animate-led-blink`}></div>
                <span className="material-symbols-outlined text-white/10 text-xs">bolt</span>
              </div>
            </div>
          </div>

          <CameraLens videoRef={videoRef} isCapturing={status === CameraStatus.CAPTURING} />

          {/* Ejection Slot Area */}
          <div className="w-full px-8 pb-10 flex flex-col items-center relative z-20 mt-auto">
            <div className="w-full h-5 bg-[#111] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="w-[96%] h-[2px] bg-[#333] shadow-inner"></div>
            </div>
            <div className="mt-2 text-[8px] font-bold text-gray-300 tracking-[0.2em] opacity-40 uppercase">Ejecting Film Slot</div>
          </div>
        </div>

        {/* Printed Polaroid */}
        {lastPolaroid && (
          <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} />
        )}
      </div>

      {/* Controls Container */}
      <div className="w-full max-w-sm px-6 mt-12 mb-12">
        <div className="flex items-center justify-between w-full px-4">
          
          {/* Local Filter Button */}
          <button 
            onClick={() => setIsCustomizing(true)}
            className="flex flex-col items-center gap-2 group transition-all"
          >
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-md group-active:scale-90 transition-all ${currentFilter !== 'none' ? 'bg-indigo-500/30 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/10'}`}>
              <span className={`material-symbols-outlined text-[20px] ${currentFilter !== 'none' ? 'text-indigo-400' : 'text-white'}`}>
                {currentFilter !== 'none' ? 'auto_fix_high' : 'filter_frames'}
              </span>
            </div>
            <span className={`text-[9px] font-black tracking-widest uppercase ${currentFilter !== 'none' ? 'text-indigo-400' : 'text-white/40'}`}>
              LENS
            </span>
          </button>

          {/* Main Shutter Button */}
          <button 
            onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
            className="relative group touch-manipulation"
          >
            <div className="absolute inset-0 bg-pola-red/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
            <div className={`w-[84px] h-[84px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] border-[5px] group-active:scale-95 group-active:translate-y-1 transition-all ${status === CameraStatus.PRINTING ? 'bg-white border-gray-200' : 'bg-[#d62828] border-[#a01a1a]'}`}>
              <div className={`w-[60px] h-[60px] rounded-full border border-white/5 ${status === CameraStatus.PRINTING ? 'bg-black/5 flex items-center justify-center' : 'bg-gradient-to-br from-white/10 to-transparent'}`}>
                {status === CameraStatus.PRINTING ? (
                  <span className="material-symbols-outlined text-black/60 text-[24px]">replay</span>
                ) : (
                  status === CameraStatus.CAPTURING ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/5 to-transparent"></div>
                  )
                )}
              </div>
            </div>
          </button>

          {/* Gallery Button (Film) */}
          <button 
            onClick={handleGalleryClick}
            className="flex flex-col items-center gap-2 group transition-all"
          >
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md group-active:scale-90">
              <span className="material-symbols-outlined text-white text-[20px]">add_photo_alternate</span>
            </div>
            <span className="text-[9px] text-white/40 font-black tracking-widest uppercase">FILM</span>
          </button>
        </div>
      </div>

      {/* Decoration */}
      <div className="flex items-center justify-center gap-2 w-full opacity-40 py-4">
        <div className="h-1.5 w-1.5 rounded-full bg-[#FFD400]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-[#F5821F]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-[#E4002B]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-[#009D4E]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-[#0058A8]"></div>
      </div>

      {/* Overlays */}
      {isCustomizing && (
        <Customizer 
          currentFilter={currentFilter}
          onSetFilter={setCurrentFilter}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </div>
  );
};

export default App;