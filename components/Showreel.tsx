
import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { SITE_INFO } from '../constants';

const Showreel = () => {
  const { stopReel } = useAppContext();

  return (
    <motion.div
      className="fixed inset-0 bg-background z-[100] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Background elements to keep it cinematic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          stopReel();
        }}
        className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-white hover:bg-accent hover:text-background transition-all hover:rotate-90 duration-500"
        aria-label="Close Showreel"
      >
        <X size={24} strokeWidth={1.5} />
      </button>

      <div className="container mx-auto px-6 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="space-y-8 md:space-y-12"
        >
          <div className="flex flex-col items-center gap-6">
             <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="text-accent/10"
                >
                  <Loader2 size={80} className="md:w-32 md:h-32" strokeWidth={0.5} />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                </div>
             </div>
             
             <div className="space-y-4">
                <motion.h2 
                  className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none"
                  animate={{ letterSpacing: ["-0.05em", "-0.02em", "-0.05em"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  Showreel is <br /> <span className="text-neutral-800">getting cooked</span>
                </motion.h2>
                <p className="text-sm md:text-xl text-neutral-500 uppercase tracking-[0.4em] font-mono italic">
                  Good things take time.
                </p>
             </div>
          </div>

          <div className="max-w-md mx-auto h-[1px] bg-white/5 relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-accent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="pt-8">
            <span className="text-[9px] uppercase tracking-[0.8em] text-neutral-700 font-mono block mb-4">
              Status: Rendering_Artifact // High_Bitrate
            </span>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-accent/20"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cinematic scanlines effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_4px,4px_100%] z-20 opacity-30" />
    </motion.div>
  );
};

export default Showreel;
