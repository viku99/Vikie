
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2,
  Maximize,
  Minimize
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface VideoPlayerProps {
  type: 'local' | 'youtube' | 'video';
  src: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
    _ytInitializers?: Array<() => void>;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  type, 
  src, 
  className = "", 
  showControls = true, 
  autoplay = false
}) => {
  const { activeVideoId, setActiveVideoId } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const isMountedRef = useRef(true);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | 'mute' | 'unmute' | null>(null);
  
  const playerId = useRef(`player-${Math.random().toString(36).substr(2, 9)}`).current;

  // ============================================================================
  // COORDINATION & FULLSCREEN LOGIC
  // ============================================================================
  
  useEffect(() => {
    isMountedRef.current = true;
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    const isActive = activeVideoId === playerId;

    try {
      if (type === 'youtube') {
        if (isActive) {
          playerRef.current.unMute?.();
          playerRef.current.setVolume?.(100);
          playerRef.current.playVideo?.();
          setIsMuted(false);
        } else {
          playerRef.current.pauseVideo?.();
        }
      } else {
        const video = playerRef.current as HTMLVideoElement;
        if (isActive) {
          video.muted = false;
          video.play().catch(() => {});
          setIsMuted(false);
        } else {
          video.pause();
        }
      }
    } catch (err) {
      console.warn("Playback sync error:", err);
    }
  }, [activeVideoId, playerId, type]);

  // ============================================================================
  // YOUTUBE ENGINE
  // ============================================================================

  const onPlayerReady = useCallback((event: any) => {
    if (!isMountedRef.current) return;
    isReadyRef.current = true;
    setIsReady(true);
    
    if (activeVideoId === playerId) {
      event.target.unMute();
      event.target.playVideo();
      setIsMuted(false);
    }
  }, [activeVideoId, playerId]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (!isMountedRef.current) return;
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      event.target.seekTo(0);
      event.target.playVideo();
    }
  }, []);

  const initYT = useCallback(() => {
    if (!isMountedRef.current || !window.YT || !window.YT.Player || playerRef.current) return;
    
    playerRef.current = new window.YT.Player(playerId, {
      width: '100%',
      height: '100%',
      videoId: src,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
        fs: 0, 
        disablekb: 1,
        mute: 1, 
        loop: 1,
        playlist: src,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      }
    });
  }, [src, autoplay, playerId, onPlayerReady, onPlayerStateChange]);

  useEffect(() => {
    if (type !== 'youtube') {
      isReadyRef.current = true;
      setIsReady(true);
      return;
    }

    if (!window.YT || !window.YT.Player) {
      if (!window._ytInitializers) {
        window._ytInitializers = [];
        window.onYouTubeIframeAPIReady = () => {
          if (window._ytInitializers) {
            window._ytInitializers.forEach(cb => cb());
            delete window._ytInitializers;
          }
        };
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window._ytInitializers.push(initYT);
    } else {
      initYT();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        isReadyRef.current = false;
      }
      // Remove self from initializers if unmounted before script load
      if (window._ytInitializers) {
        window._ytInitializers = window._ytInitializers.filter(cb => cb !== initYT);
      }
    };
  }, [type, initYT]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isReady) return;

    if (activeVideoId === playerId) {
      if (isPlaying) {
        if (type === 'youtube') playerRef.current?.pauseVideo();
        else playerRef.current?.pause();
        setShowStatusIcon('pause');
      } else {
        if (type === 'youtube') playerRef.current?.playVideo();
        else playerRef.current?.play().catch(() => {});
        setShowStatusIcon('play');
      }
    } else {
      setActiveVideoId(playerId);
      setShowStatusIcon('play');
    }
    
    setTimeout(() => {
        if (isMountedRef.current) setShowStatusIcon(null);
    }, 800);
  };

  const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isReady) return;
    
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    
    if (type === 'youtube') {
      if (nextMute) playerRef.current?.mute();
      else {
        playerRef.current?.unMute();
        playerRef.current?.setVolume(100);
      }
    } else if (playerRef.current) {
      (playerRef.current as HTMLVideoElement).muted = nextMute;
    }
    
    setShowStatusIcon(nextMute ? 'mute' : 'unmute');
    setTimeout(() => {
        if (isMountedRef.current) setShowStatusIcon(null);
    }, 800);
  };

  const toggleFullscreen = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black group/vid touch-action-manipulation ${className} ${isFullscreen ? 'z-[9999]' : ''}`}
      onClick={handleInteraction}
      style={{ transform: 'translateZ(0)' }}
    >
      {type === 'youtube' ? (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className={`relative flex-shrink-0 will-change-transform ${isFullscreen ? 'w-full h-full' : 'w-[116%] h-[116%]'}`}>
            <div id={playerId} className="w-full h-full" />
          </div>
        </div>
      ) : (
        <video 
          ref={playerRef}
          className="w-full h-full object-cover will-change-transform" 
          src={src} 
          muted={isMuted} 
          loop 
          // Removed non-standard webkitPlaysInline property to fix TypeScript error
          playsInline 
          autoPlay={autoplay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-accent/20 animate-spin" strokeWidth={1} />
        </div>
      )}

      {/* Manual Controls Overlay */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-30 flex gap-2 md:gap-3 opacity-0 group-hover/vid:opacity-100 transition-opacity">
        <button 
          onClick={toggleFullscreen}
          className="p-3 md:p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white active:scale-90 transition-all hover:bg-accent hover:text-background"
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
        <button 
          onClick={toggleMute}
          className="p-3 md:p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white active:scale-90 transition-all hover:bg-accent hover:text-background"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button 
          onClick={handleInteraction}
          className="p-3 md:p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white active:scale-90 transition-all hover:bg-accent hover:text-background"
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>

      <AnimatePresence>
        {showStatusIcon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 backdrop-blur-xl p-6 md:p-8 rounded-full border border-white/10 text-white shadow-2xl">
              {showStatusIcon === 'pause' && <Pause fill="currentColor" size={32} className="md:w-10 md:h-10" />}
              {showStatusIcon === 'mute' && <VolumeX size={32} className="md:w-10 md:h-10" />}
              {showStatusIcon === 'unmute' && <Volume2 size={32} className="md:w-10 md:h-10" />}
              {showStatusIcon === 'play' && <Play fill="currentColor" size={32} className="md:w-10 md:h-10" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
