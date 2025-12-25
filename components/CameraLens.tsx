import React, { useEffect } from 'react';

interface CameraLensProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCapturing: boolean;
}

const CameraLens: React.FC<CameraLensProps> = ({ videoRef, isCapturing }) => {
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      const constraints = [
        { video: { facingMode: 'user', width: { ideal: 1000 }, height: { ideal: 1000 } } },
        { video: { facingMode: 'user' } },
        { video: true }
      ];

      for (const constraint of constraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraint);
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            return;
          }
        } catch (err) {
          console.warn(`Constraint failed:`, constraint, err);
        }
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  return (
    <div className="w-full flex items-center justify-center flex-1 pb-2 relative z-10 -mt-6">
      <div className={`w-40 h-40 rounded-full bg-[#1a1a1a] shadow-[0_10px_25px_rgba(0,0,0,0.2)] flex items-center justify-center relative transition-transform duration-200 ${isCapturing ? 'scale-95' : ''}`}>
        <div className="absolute inset-0 rounded-full border-[6px] border-[#222] shadow-[inset_0_0_10px_rgba(0,0,0,1)]"></div>
        <div className="absolute inset-2 rounded-full border-[2px] border-[#333]"></div>
        <div className="w-28 h-28 rounded-full bg-[#050505] border border-[#333] flex items-center justify-center relative shadow-inner overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-full pointer-events-none z-10"></div>
          
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover rounded-full grayscale-[5%] contrast-[1.05] scale-110 bg-black"
          />

          <div className="w-14 h-14 rounded-full bg-black/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] relative flex items-center justify-center border border-white/5 z-20 pointer-events-none">
            <div className="absolute top-3 right-4 w-5 h-3 bg-white/10 rounded-full blur-[3px] -rotate-45"></div>
            <div className="absolute bottom-3 left-4 w-3 h-3 bg-white/5 rounded-full blur-[4px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraLens;