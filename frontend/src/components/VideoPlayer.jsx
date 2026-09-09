import { useState, useRef } from 'react';
import { Play, Volume2, VolumeX, Maximize, Pause } from 'lucide-react';

export default function VideoPlayer({ 
  src, 
  poster, 
  title = "Video",
  className = "",
  autoPlay = false 
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (!src) return null;

  return (
    <div
      className={`relative group overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      data-testid="video-player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        loop
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play overlay (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/50"
          data-testid="video-play-overlay"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#8A8A8A] transition-colors"
              data-testid="video-play-btn"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#8A8A8A] transition-colors"
              data-testid="video-mute-btn"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <span className="text-white/70 text-xs font-inter">{title}</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[#8A8A8A] transition-colors"
            data-testid="video-fullscreen-btn"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
