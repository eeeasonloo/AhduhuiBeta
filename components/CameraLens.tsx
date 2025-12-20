
import React, { useEffect } from 'react';

interface CameraLensProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCapturing: boolean;
}

const CameraLens: React.FC<CameraLensProps> = ({ videoRef, isCapturing }) => {
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      const constraints = [
        // Preferred: User-facing camera with ideal dimensions
        { 
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 640 } 
          } 
        },
        // Fallback 1: Any user-facing camera
        { video: { facingMode: 'user' } },
        // Fallback 2: Any available camera
        { video: true }
      ];

      for (const constraint of constraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraint);
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Successfully initialized
            return;
          }
        } catch (err) {
          console.warn(`Constraint failed:`, constraint, err);
          // Continue to next fallback
        }
      }

      console.error("All camera access attempts failed.");
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
    <div className="w-full flex items-center justify-center flex-1 pb-4">
      <div className={`w-48 h-48 rounded-full bg-[#111] shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center border border-[#222] relative group transition-all duration-300 ${isCapturing ? 'scale-95 brightness-150' : ''}`}>
        <div className="absolute inset-2 rounded-full border border-white/5 opacity-50"></div>
        <div className="w-36 h-36 rounded-full bg-[#080808] border border-[#1a1a1a] flex items-center justify-center relative shadow-inner overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-full pointer-events-none z-10"></div>
          
          {/* Live Video Preview */}
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover rounded-full grayscale-[20%] contrast-[1.1] scale-110 bg-black"
          />

          {/* Lens Reflections */}
          <div className="w-16 h-16 rounded-full bg-transparent relative flex items-center justify-center pointer-events-none z-20">
            <div className="absolute top-4 right-5 w-4 h-2 bg-white/10 rounded-full blur-[2px] -rotate-45"></div>
            <div className="absolute bottom-4 left-5 w-2 h-2 bg-blue-500/5 rounded-full blur-[3px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraLens;
