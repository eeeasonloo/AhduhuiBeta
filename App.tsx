
import React, { useState, useRef, useCallback } from 'react';
import { CameraStatus, PolaroidData } from './types';
import CameraLens from './components/CameraLens';
import Polaroid from './components/Polaroid';
import Customizer from './components/Customizer';
import { modifyImageWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<CameraStatus>(CameraStatus.IDLE);
  const [lastPolaroid, setLastPolaroid] = useState<PolaroidData | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const captureFrame = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Capture a square aspect ratio
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Center crop
    const x = (video.videoWidth - size) / 2;
    const y = (video.videoHeight - size) / 2;
    
    ctx.drawImage(video, x, y, size, size, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  }, []);

  const handleCapture = async () => {
    if (status !== CameraStatus.IDLE) return;
    
    setStatus(CameraStatus.CAPTURING);
    
    // Shutter sound / visual feedback simulation
    await new Promise(r => setTimeout(r, 200));
    
    const imageUrl = captureFrame();
    if (imageUrl) {
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      
      const newPolaroid: PolaroidData = {
        id: Math.random().toString(36).substr(2, 9),
        url: imageUrl,
        date: formattedDate,
        label: 'SOFORT',
        filterName: 'MONO'
      };
      
      setLastPolaroid(newPolaroid);
      setStatus(CameraStatus.PRINTING);
      
      // Auto-reset after printing animation finishes
      setTimeout(() => {
        // We keep the printed state for a bit for the user to see
        // setStatus(CameraStatus.IDLE); 
      }, 3000);
    } else {
      setStatus(CameraStatus.ERROR);
    }
  };

  const handleCustomPrint = async (aiPrompt: string) => {
    if (!lastPolaroid) return;
    
    setIsProcessingAI(true);
    const modifiedUrl = await modifyImageWithAI(lastPolaroid.url, aiPrompt);
    
    if (modifiedUrl) {
      const updatedPolaroid: PolaroidData = {
        ...lastPolaroid,
        id: Math.random().toString(36).substr(2, 9),
        url: modifiedUrl,
        filterName: 'AI CUSTOM'
      };
      
      setLastPolaroid(updatedPolaroid);
      setShowCustomizer(false);
      setStatus(CameraStatus.PRINTING);
      
      // Reset animation
      const tempStatus = CameraStatus.IDLE;
      setStatus(tempStatus);
      setTimeout(() => setStatus(CameraStatus.PRINTING), 50);
    }
    
    setIsProcessingAI(false);
  };

  const resetCamera = () => {
    setStatus(CameraStatus.IDLE);
  };

  return (
    <div className="bg-[#050505] font-display antialiased h-[100dvh] w-full overflow-hidden select-none text-white flex flex-col items-center">
      <div className="w-full h-[6vh]"></div>

      {/* Camera Body */}
      <div className="relative w-[88%] max-w-sm aspect-[1.1/1] bg-[#1a1a1b] rounded-[2.5rem] shadow-camera-body border border-white/10 flex flex-col items-center z-20 leather-texture">
        <div className="w-full flex justify-between items-center px-8 pt-6 mb-2">
          <h1 className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase">Instant M</h1>
          <div className="w-7 h-7 bg-leica-red rounded-full flex items-center justify-center shadow-lg ring-1 ring-black/30">
            <span className="text-white font-serif font-bold text-[10px] italic pt-[1px]">Leica</span>
          </div>
        </div>

        <CameraLens videoRef={videoRef} isCapturing={status === CameraStatus.CAPTURING} />

        {/* Slot */}
        <div className="w-full px-12 pb-6 flex flex-col items-center relative">
          <div className="w-full h-3.5 bg-[#080808] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.05)] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
            <div className="w-[92%] h-[1px] bg-white/10 shadow-[0_0_2px_rgba(255,255,255,0.2)]"></div>
          </div>
          <div className="absolute bottom-2 right-10 flex gap-1.5">
            <div className={`w-1 h-1 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)] ${status === CameraStatus.PRINTING ? 'bg-orange-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
          </div>
        </div>
      </div>

      {/* Printed Polaroid */}
      {lastPolaroid && (
        <Polaroid data={lastPolaroid} isPrinting={status === CameraStatus.PRINTING} />
      )}

      {/* Controls */}
      <div className="mt-auto w-full relative z-40 pb-12 pt-8 px-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
        <div className="flex items-center justify-between w-full mb-8 px-4">
          
          {/* Customizer Button */}
          <button 
            onClick={() => {
              if (lastPolaroid) setShowCustomizer(true);
            }}
            disabled={!lastPolaroid}
            className={`flex flex-col items-center gap-2 group transition-opacity ${!lastPolaroid ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-white text-[20px]">tune</span>
            </div>
            <span className="text-[9px] text-white/50 font-medium tracking-wide">CUSTOM</span>
          </button>

          {/* Shutter Button */}
          <button 
            onClick={status === CameraStatus.PRINTING ? resetCamera : handleCapture}
            className="relative group touch-manipulation mx-4"
          >
            <div className={`absolute inset-0 bg-leica-red/20 rounded-full blur-xl group-active:blur-md transition-all opacity-0 group-hover:opacity-100 ${status === CameraStatus.CAPTURING ? 'opacity-100' : ''}`}></div>
            <div className={`w-[84px] h-[84px] rounded-full flex items-center justify-center shadow-[0_5px_20px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.25)] border-[3px] group-active:scale-95 group-active:translate-y-1 transition-all ${status === CameraStatus.PRINTING ? 'bg-white border-gray-300' : 'bg-[#d20000] border-[#990000]'}`}>
              <div className={`w-[68px] h-[68px] rounded-full border border-white/10 ${status === CameraStatus.PRINTING ? 'bg-black/5' : 'bg-gradient-to-br from-white/10 to-transparent'}`}>
                {status === CameraStatus.PRINTING && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-black/40">refresh</span>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Share Button (Mock) */}
          <button className="flex flex-col items-center gap-2 group opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md group-active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-white text-[20px]">ios_share</span>
            </div>
            <span className="text-[9px] text-white/50 font-medium tracking-wide">SHARE</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 w-full opacity-20">
          <div className="h-1 w-1 rounded-full bg-white"></div>
          <div className="h-1 w-1 rounded-full bg-white"></div>
          <div className="h-1 w-1 rounded-full bg-white"></div>
        </div>
      </div>

      {/* AI Customizer Modal */}
      <Customizer 
        isOpen={showCustomizer} 
        onClose={() => setShowCustomizer(false)} 
        onApply={handleCustomPrint}
        isProcessing={isProcessingAI}
      />
    </div>
  );
};

export default App;
