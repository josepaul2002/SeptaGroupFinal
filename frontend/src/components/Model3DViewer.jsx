import { useState, useEffect, useRef, Suspense } from 'react';
import { Box, Monitor, Smartphone, RotateCw, Loader2 } from 'lucide-react';

export default function Model3DViewer({ 
  modelUrl, 
  fallbackVideoUrl,
  posterImage,
  className = "" 
}) {
  const [viewerState, setViewerState] = useState('idle'); // idle, loading, loaded, error
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleView3D = () => {
    if (isMobile) {
      setShowMobileWarning(true);
      return;
    }
    setViewerState('loading');
  };

  const handleMobileConfirm = () => {
    setShowMobileWarning(false);
    setViewerState('loading');
  };

  if (!modelUrl && !fallbackVideoUrl) return null;

  return (
    <div className={`relative ${className}`} data-testid="model-3d-viewer">
      {/* Idle state - poster with button */}
      {viewerState === 'idle' && (
        <div className="relative aspect-video bg-[#050505] overflow-hidden">
          {posterImage && (
            <img
              src={posterImage}
              alt="3D Preview"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Box size={48} className="text-white/30" strokeWidth={1} />
            <div className="flex flex-col sm:flex-row gap-3">
              {modelUrl && (
                <button
                  onClick={handleView3D}
                  className="flex items-center gap-2 px-6 py-3 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-[#262626] transition-colors"
                  data-testid="view-3d-btn"
                >
                  <Box size={16} /> View 3D Model
                </button>
              )}
              {fallbackVideoUrl && (
                <a
                  href={fallbackVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-white/10 transition-colors"
                  data-testid="watch-video-btn"
                >
                  Watch Drone Video
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Warning */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-white max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone size={24} className="text-[#8A8A8A]" />
              <h3 className="text-lg font-sora font-medium text-[#050505]">
                3D Best on Desktop
              </h3>
            </div>
            <p className="text-sm font-inter text-[#050505]/60 mb-6">
              The 3D viewer works best on larger screens. Would you like to continue on mobile or watch the drone video instead?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleMobileConfirm}
                className="w-full px-4 py-2 bg-[#050505] text-white text-xs font-inter font-medium uppercase tracking-wider"
              >
                Continue Anyway
              </button>
              {fallbackVideoUrl && (
                <a
                  href={fallbackVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 border border-[#050505]/20 text-[#050505] text-xs font-inter font-medium uppercase tracking-wider text-center"
                  onClick={() => setShowMobileWarning(false)}
                >
                  Watch Video Instead
                </a>
              )}
              <button
                onClick={() => setShowMobileWarning(false)}
                className="w-full px-4 py-2 text-[#8A8A8A] text-xs font-inter"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {viewerState === 'loading' && (
        <div className="aspect-video bg-[#050505] flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-[#606060] animate-spin" />
          <p className="text-sm font-inter text-white/50">Loading 3D model...</p>
        </div>
      )}

      {/* 3D Viewer placeholder */}
      {viewerState === 'loaded' && (
        <div className="relative aspect-video bg-[#050505]">
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <p className="text-sm font-inter">3D Viewer - GLB/GLTF Renderer</p>
          </div>
          
          {/* Controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/50 text-xs font-inter">
              <RotateCw size={14} /> Drag to rotate
            </div>
            <button
              onClick={() => setViewerState('idle')}
              className="text-white/50 hover:text-white text-xs font-inter"
            >
              Close 3D
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {viewerState === 'error' && (
        <div className="aspect-video bg-[#050505] flex flex-col items-center justify-center gap-4">
          <p className="text-sm font-inter text-white/50">Failed to load 3D model</p>
          {fallbackVideoUrl && (
            <a
              href={fallbackVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/30 text-white text-xs font-inter font-medium uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Watch Drone Video Instead
            </a>
          )}
        </div>
      )}
    </div>
  );
}
