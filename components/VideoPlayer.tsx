
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface VideoPlayerProps {
  type: 'local' | 'youtube' | 'video';
  src: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
  isReelsMode?: boolean;
  reelId?: string;
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
  autoplay = true,
  isReelsMode = false,
  reelId
}) => {
  const { activeVideoId, setActiveVideoId, isGlobalMuted, setIsGlobalMuted } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | 'mute' | 'unmute' | null>(null);
  
  // Stable ID to prevent re-renders of the video container
  const playerId = useRef(reelId || `v-${Math.random().toString(36).slice(2, 11)}`).current;

  // ============================================================================
  // PLAYBACK COORDINATOR
  // ============================================================================
  
  const applyPlaybackState = useCallback(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    const isActive = activeVideoId === playerId;

    try {
      if (type === 'youtube') {
        if (isActive && !isHoldingRef.current) {
          playerRef.current.playVideo?.();
          if (isGlobalMuted) playerRef.current.mute?.();
          else {
            playerRef.current.unMute?.();
            playerRef.current.setVolume?.(100);
          }
        } else {
          playerRef.current.pauseVideo?.();
        }
      } else {
        const video = playerRef.current as HTMLVideoElement;
        if (isActive && !isHoldingRef.current) {
          video.muted = isGlobalMuted;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    } catch (e) {
      // Catching errors silently to prevent app crashes on API race conditions
    }
  }, [activeVideoId, playerId, isGlobalMuted, type]);

  useEffect(() => {
    applyPlaybackState();
  }, [applyPlaybackState]);

  // ============================================================================
  // YOUTUBE API ENGINE
  // ============================================================================

  const onPlayerReady = useCallback(() => {
    isReadyRef.current = true;
    setIsReady(true);
    applyPlaybackState();
  }, [applyPlaybackState]);

  const onPlayerStateChange = useCallback((event: any) => {
    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      event.target.seekTo(0);
      event.target.playVideo();
    }
  }, []);

  const initYT = useCallback(() => {
    if (!window.YT || !window.YT.Player || playerRef.current) return;
    
    playerRef.current = new window.YT.Player(playerId, {
      videoId: src,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        mute: isGlobalMuted ? 1 : 0,
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
  }, [src, autoplay, playerId, isGlobalMuted, onPlayerReady, onPlayerStateChange]);

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
          window._ytInitializers?.forEach(cb => cb());
          delete window._ytInitializers;
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
    };
  }, [type, initYT]);

  // ============================================================================
  // REELS INTERACTIONS
  // ============================================================================

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isReelsMode || !isReady) return;
    
    // Hold to pause logic
    holdTimerRef.current = window.setTimeout(() => {
      isHoldingRef.current = true;
      if (type === 'youtube') playerRef.current?.pauseVideo?.();
      else playerRef.current?.pause();
      setShowStatusIcon('pause');
    }, 200);
  };

  const handlePointerUp = () => {
    if (!isReelsMode || !isReady) return;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setShowStatusIcon(null);
      // Resume if this is still the active reel
      if (activeVideoId === playerId) {
        if (type === 'youtube') playerRef.current?.playVideo?.();
        else playerRef.current?.play().catch(() => {});
      }
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    // Prevent tap event firing after a long hold
    if (isHoldingRef.current) return;
    
    e.stopPropagation();
    if (!isReady) return;

    if (isReelsMode) {
      // Tap to toggle Mute globally
      const newMuted = !isGlobalMuted;
      setIsGlobalMuted(newMuted);
      setShowStatusIcon(newMuted ? 'mute' : 'unmute');
      setTimeout(() => setShowStatusIcon(null), 800);
    } else {
      // Toggle play/pause or set active
      if (activeVideoId === playerId) {
        if (isPlaying) {
          if (type === 'youtube') playerRef.current?.pauseVideo?.();
          else playerRef.current?.pause();
        } else {
          if (type === 'youtube') playerRef.current?.playVideo?.();
          else playerRef.current?.play().catch(() => {});
        }
      } else {
        setActiveVideoId(playerId);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black select-none cursor-pointer group/vid ${className}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleTap}
    >
      {type === 'youtube' ? (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* We wrap the ID in a div that never changes to keep YT API happy */}
          <div className="w-full h-full scale-[1.15] pointer-events-none">
            <div id={playerId} />
          </div>
        </div>
      ) : (
        <video 
          ref={playerRef}
          className="w-full h-full object-cover" 
          src={src} 
          muted={isGlobalMuted} 
          loop 
          playsInline 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Loading */}
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <Loader2 className="w-10 h-10 text-accent/20 animate-spin" strokeWidth={1} />
        </div>
      )}

      {/* Status Icons Overlay */}
      <AnimatePresence>
        {showStatusIcon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/40 backdrop-blur-xl p-8 rounded-full border border-white/10 text-white">
              {showStatusIcon === 'pause' && <Pause fill="currentColor" size={40} />}
              {showStatusIcon === 'mute' && <VolumeX size={40} />}
              {showStatusIcon === 'unmute' && <Volume2 size={40} />}
              {showStatusIcon === 'play' && <Play fill="currentColor" size={40} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence Indicator */}
      {isReelsMode && isReady && (
        <div className="absolute top-6 left-6 z-30 opacity-0 group-hover/vid:opacity-40 transition-opacity">
          {isGlobalMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
