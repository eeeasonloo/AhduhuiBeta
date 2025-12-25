
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraStatus, PolaroidData } from './types';
import CameraLens from './components/CameraLens';
import Polaroid from './components/Polaroid';
import { modifyImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [lastPolaroid, setLastPolaroid] = useState<PolaroidData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('none');
  const [currentAiPrompt, setCurrentAiPrompt] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  
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
        canvas.width = 1024; 
        canvas.height = 1024;
        
        ctx.clearRect(0, 0, 1024, 1024);
        
        const x = (w - size) / 2;
        const y = (h - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 1024, 1024);
        
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
  }, []);

  const triggerPrint = (imageUrl: string, isGallery: boolean = false) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    
    const newPolaroid: PolaroidData = {
      id: Math.random().toString(36).substr(2, 9),
      url: imageUrl,
      date: formattedDate,
      label: isGallery ? 'GALLERY ARCHIVE' : (currentAiPrompt ? 'AI ENHANCED' : 'INSTANT FILM'),
      filterName: currentFilter
    };
    
    setLastPolaroid(newPolaroid);
    setStatus(CameraStatus.PRINTING);
  };

  const handleCapture = async () => {
    if (status !== CameraStatus.IDLE) return;
    
    setStatus(CameraStatus.CAPTURING);
    setErrorMsg(null);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
    
    await new Promise(r => setTimeout(r, 300));
    
    let imgData = await captureFrame();
    if (!imgData) {
      setErrorMsg("Unable to access camera frame.");
      setStatus(CameraStatus.IDLE);
      return;
    }

    if (currentAiPrompt) {
      const aiModified = await modifyImageWithAI(imgData, currentAiPrompt);
      if (aiModified) {
        imgData = aiModified;
      } else {
        setErrorMsg("AI transformation failed, printing original.");
      }
    }

    triggerPrint(imgData);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const generatePolaroidWithFrame = async (data: PolaroidData): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#fdfdfd';
      ctx.fillRect(0, 0, width, height);

      const img = new Image();
      img.onload = () => {
        const padding = 60;
        const imgSize = width - (padding * 2);
        
        ctx.save();
        ctx.filter = `${data.filterName !== 'none' ? data.filterName : ''} sepia(0.2) contrast(1.1) saturate(1.1) brightness(1.02)`;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(padding - 2, padding - 2, imgSize + 4, imgSize + 4);
        ctx.drawImage(img, padding, padding, imgSize, imgSize);
        ctx.restore();

        ctx.fillStyle = '#9ca3af'; 
        ctx.font = 'italic black 24px "Noto Sans", monospace';
        ctx.textAlign = 'center';
        const labelText = `${data.date} • ${data.label}`;
        ctx.fillText(labelText.toUpperCase(), width / 2, height - 80);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Blob creation failed');
        }, 'image/png');
      };
      img.onerror = () => reject('Image load failed');
      img.src = data.url;
    });
  };

  const handleShare = async () => {
    if (!lastPolaroid || isSharing) return;
    
    setIsSharing(true);
    try {
      const framedBlob = await generatePolaroidWithFrame(lastPolaroid);
      const file = new File([framedBlob], `ahduhui-polaroid-${lastPolaroid.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Ahduhui's Polaroid",
          text: `Captured on ${lastPolaroid.date}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(framedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ahduhui-polaroid-${lastPolaroid.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share failed:', err);
      setErrorMsg("Failed to generate or share the framed photo.");
    } finally {
      setIsSharing(false);
    }
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
          const aiModified = await modifyImageWithAI(processedImg, currentAiPrompt);
          if (aiModified) processedImg = aiModified;
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

  return (
    <div ref={appContainerRef} className="bg-[#080808] font-display antialiased min-h-screen w-full overflow-y-auto overflow-x-hidden select-none text-white flex flex-col items-center pb-32">
      
      {showFlash && (
        <div className="fixed inset-0 bg-white z-[300] pointer-events-none animate-out fade-out duration-300"></div>
      )}

      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-red-500 text-xl">error</span>
            <p className="text-[11px] font-medium text-gray-300 leading-tight">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="w-full h-[6vh]"></div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <div className="w-full flex flex-col items-center justify-center mb-8 pointer-events-none gap-2">
        <img 
          src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-zk8KwTWVtOiCNfuY7MhvuW6j8Bgxwf.png" 
          alt="Brand Logo" 
          className="h-10 w-auto object-contain"
        />
        <div className="flex items-center gap-3 opacity-30">
           <div className="h-px w-8 bg-white"></div>
           <span className="text-white font-display font-black text-[7px] tracking-[0.5em] uppercase">Ahduhui's Polaroid</span>
           <div className="h-px w-8 bg-white"></div>
        </div>
      </div>

      <div className="relative w-[92%] max-w-sm flex flex-col items-center flex-shrink-0">
        <div className="relative w-full aspect-[1/0.95] bg-[#fafafa] rounded-[2.8rem] shadow-camera-body border border-white/40 flex flex-col items-center z-20 plastic-texture overflow-visible">
          <div className="absolute top-0 bottom-[40%] left-1/2 -translate-x-1/2 w-10 rainbow-stripe opacity-90 z-10"></div>
          
          <div className="w-full flex justify-between items-start px-8 pt-10 mb-2 z-20">
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col p-1 shadow-md border border-gray-300/50">
              <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-[3px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:4px_100%]"></div>
              </div>
            </div>
            
            <div className="w-16 h-12 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center shadow-md border border-gray-300/50 relative overflow-hidden">
              <div className="w-10 h-10 bg-[#050505] rounded shadow-inner flex items-center justify-center relative">
                <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,1)] ${status === CameraStatus.CAPTURING ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} animate-led-blink transition-colors duration-500`}></div>
                <span className="material-symbols-outlined text-xs text-white/10 italic">bolt</span>
              </div>
            </div>
          </div>

          <CameraLens 
            videoRef={videoRef} 
            isCapturing={status === CameraStatus.CAPTURING} 
          />

          <div className="w-full px-10 pb-10 flex flex-col items-center relative z-20 mt-auto">
            <div className="w-full h-6 bg-[#111] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="w-[98%] h-[2px] bg-[#333]"></div>
            </div>
            <div className="mt-2 text-[6px] font-black text-gray-400 tracking-[0.4em] uppercase opacity-40 italic">Instant Output Slot</div>
          </div>
        </div>

        {lastPolaroid && (
          <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} filter={lastPolaroid.filterName} />
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-[150] h-32 flex items-center justify-center px-8 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="w-full max-w-sm flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGalleryClick}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
              title="Import from Gallery"
            >
              <span className="material-symbols-outlined text-white text-2xl">photo_library</span>
            </button>
          </div>

          <button 
            disabled={status === CameraStatus.CAPTURING}
            onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
            className="group relative flex items-center justify-center"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${status === CameraStatus.CAPTURING ? 'scale-90 brightness-75' : 'active:scale-95'}`}>
              <div className={`w-full h-full rounded-full border-4 border-white/20 p-1`}>
                <div className={`w-full h-full rounded-full shadow-inner flex items-center justify-center ${status === CameraStatus.PRINTING ? 'bg-white' : 'bg-pola-red'}`}>
                  {status === CameraStatus.CAPTURING ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : status === CameraStatus.PRINTING ? (
                    <span className="material-symbols-outlined text-black text-3xl">refresh</span>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/20 to-transparent"></div>
                  )}
                </div>
              </div>
            </div>
          </button>

          <button 
            onClick={handleShare}
            disabled={!lastPolaroid || isSharing}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500 ${lastPolaroid && !isSharing ? 'bg-indigo-600 border-indigo-400 opacity-100 active:scale-90 shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 opacity-20 grayscale pointer-events-none'}`}
            title="Share with Frame"
          >
            {isSharing ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-white text-2xl">ios_share</span>
            )}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-1000 ease-in-out ${status === CameraStatus.PRINTING ? 'h-[460px]' : 'h-12'}`}></div>

    </div>
  );
};

export default App;
