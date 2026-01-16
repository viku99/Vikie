
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2
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
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showStatusIcon, setShowStatusIcon] = useState<'play' | 'pause' | 'mute' | 'unmute' | null>(null);
  
  // Generate a unique ID for this specific player instance
  const playerId = useRef(`player-${Math.random().toString(36).substr(2, 9)}`).current;

  // ============================================================================
  // COORDINATION LOGIC
  // ============================================================================
  
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
    isReadyRef.current = true;
    setIsReady(true);
    
    // If it's already marked as the active video (e.g. from autoplay prop)
    if (activeVideoId === playerId) {
      event.target.unMute();
      event.target.playVideo();
      setIsMuted(false);
    }
  }, [activeVideoId, playerId]);

  const onPlayerStateChange = useCallback((event: any) => {
    // YT.PlayerState.PLAYING = 1, PAUSED = 2
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      // Loop
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
        mute: 1, // Start muted to satisfy browser policies
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
  // HANDLERS
  // ============================================================================

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReady) return;

    if (activeVideoId === playerId) {
      // If already active, toggle play/pause
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
      // Activate this player: Context update will trigger the useEffect play/unmute logic
      setActiveVideoId(playerId);
      setShowStatusIcon('play');
    }
    
    setTimeout(() => setShowStatusIcon(null), 800);
  };

  const toggleMute = (e: React.MouseEvent) => {
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
    setTimeout(() => setShowStatusIcon(null), 800);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black group/vid ${className}`}
      onClick={handleInteraction}
    >
      {type === 'youtube' ? (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-full scale-[1.15] pointer-events-none">
            <div id={playerId} />
          </div>
        </div>
      ) : (
        <video 
          ref={playerRef}
          className="w-full h-full object-cover" 
          src={src} 
          muted={isMuted} 
          loop 
          playsInline 
          autoPlay={autoplay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <Loader2 className="w-10 h-10 text-accent/20 animate-spin" strokeWidth={1} />
        </div>
      )}

      {/* Manual Controls Overlay */}
      <div className="absolute bottom-6 right-6 z-30 flex gap-3 opacity-0 group-hover/vid:opacity-100 transition-opacity">
        <button 
          onClick={toggleMute}
          className="p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-accent hover:text-background transition-all"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button 
          onClick={handleInteraction}
          className="p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-accent hover:text-background transition-all"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
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
            <div className="bg-black/40 backdrop-blur-xl p-8 rounded-full border border-white/10 text-white shadow-2xl">
              {showStatusIcon === 'pause' && <Pause fill="currentColor" size={40} />}
              {showStatusIcon === 'mute' && <VolumeX size={40} />}
              {showStatusIcon === 'unmute' && <Volume2 size={40} />}
              {showStatusIcon === 'play' && <Play fill="currentColor" size={40} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
