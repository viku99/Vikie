
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | 'mute' | 'unmute' | null>(null);
  
  const playerId = useRef(`player-${Math.random().toString(36).substr(2, 9)}`).current;
  const isMounted = useRef(true);
  const ytInitialized = useRef(false);

  // ============================================================================
  // INTERSECTION OBSERVER - Robust Tracking
  // ============================================================================
  useEffect(() => {
    isMounted.current = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMounted.current) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.05, rootMargin: '200px' } // Pre-load slightly before coming into view
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      isMounted.current = false;
      observer.disconnect();
    };
  }, []);

  // ============================================================================
  // YOUTUBE API HANDLING
  // ============================================================================
  const onPlayerReady = useCallback((event: any) => {
    if (!isMounted.current) return;
    setIsReady(true);
    
    // Check if we should start immediately
    const isActive = activeVideoId === playerId || (activeVideoId === null && autoplay);
    if (isActive) {
      event.target.playVideo();
    }
  }, [activeVideoId, playerId, autoplay]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (!isMounted.current) return;
    if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
    else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
    else if (event.data === window.YT.PlayerState.ENDED) {
      event.target.seekTo(0);
      event.target.playVideo();
    }
  }, []);

  const initYT = useCallback(() => {
    if (!isMounted.current || !window.YT || !window.YT.Player || ytInitialized.current || !isInView) return;
    
    ytInitialized.current = true;
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
        mute: 1, // Start muted for autoplay compliance
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
  }, [src, autoplay, playerId, onPlayerReady, onPlayerStateChange, isInView]);

  useEffect(() => {
    if (type !== 'youtube') return;

    if (isInView && !ytInitialized.current) {
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
    }
  }, [type, initYT, isInView]);

  // ============================================================================
  // LOCAL VIDEO HANDLING
  // ============================================================================
  useEffect(() => {
    if (type === 'youtube') return;
    if (videoRef.current) setIsReady(true);
  }, [type]);

  // ============================================================================
  // COORDINATION LOGIC - The heartbeat of playback
  // ============================================================================
  useEffect(() => {
    if (!isReady || !isInView) return;

    const isActive = activeVideoId === playerId || (activeVideoId === null && autoplay);

    try {
      if (type === 'youtube' && playerRef.current) {
        if (isActive) {
          if (activeVideoId === playerId) {
            playerRef.current.unMute?.();
            setIsMuted(false);
          } else {
            playerRef.current.mute?.();
            setIsMuted(true);
          }
          playerRef.current.playVideo?.();
        } else {
          playerRef.current.pauseVideo?.();
        }
      } else if (videoRef.current) {
        if (isActive) {
          videoRef.current.muted = activeVideoId !== playerId;
          setIsMuted(videoRef.current.muted);
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    } catch (err) {
      console.warn("Playback Sync error:", err);
    }
  }, [activeVideoId, playerId, type, isReady, isInView, autoplay]);

  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isReady) return;

    if (activeVideoId === playerId) {
      if (isPlaying) {
        if (type === 'youtube') playerRef.current?.pauseVideo();
        else videoRef.current?.pause();
        setShowStatusIcon('pause');
      } else {
        if (type === 'youtube') playerRef.current?.playVideo();
        else videoRef.current?.play().catch(() => {});
        setShowStatusIcon('play');
      }
    } else {
      setActiveVideoId(playerId);
      setShowStatusIcon('play');
    }
    
    setTimeout(() => {
        if (isMounted.current) setShowStatusIcon(null);
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
    } else if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
    
    setShowStatusIcon(nextMute ? 'mute' : 'unmute');
    setTimeout(() => {
        if (isMounted.current) setShowStatusIcon(null);
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
      className={`relative w-full h-full overflow-hidden bg-[#0a0a0a] group/vid touch-action-manipulation antialiased ${className} ${isFullscreen ? 'z-[9999]' : ''}`}
      onClick={handleInteraction}
      style={{ transform: 'translate3d(0,0,0)' }}
    >
      {/* Background Poster placeholder */}
      <div className="absolute inset-0 bg-[#0d0d0d] z-0" />

      <div className={`w-full h-full transition-opacity duration-1000 ${isReady && isInView ? 'opacity-100' : 'opacity-0'}`}>
        {type === 'youtube' ? (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className={`relative flex-shrink-0 ${isFullscreen ? 'w-full h-full' : 'w-[105%] h-[105%]'}`}>
              <div id={playerId} className="w-full h-full" />
            </div>
          </div>
        ) : (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover will-change-transform" 
            src={src} 
            muted={isMuted} 
            loop 
            playsInline 
            autoPlay={autoplay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      {(!isReady || !isInView) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-8 h-8 text-white/10 animate-spin" strokeWidth={1} />
        </div>
      )}

      {/* Manual Controls Overlay */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-30 flex gap-2 md:gap-3 opacity-0 group-hover/vid:opacity-100 transition-opacity">
        <button 
          onClick={toggleFullscreen}
          className="p-3 md:p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white active:scale-90 transition-all hover:bg-accent hover:text-background"
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
