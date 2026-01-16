
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Cpu, Zap, ChevronDown, Terminal } from 'lucide-react';
import { PROJECTS } from '../constants';
import VideoPlayer from '../components/VideoPlayer';
import { useAppContext } from '../contexts/AppContext';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } 
    }
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { setActiveVideoId, setIsGlobalMuted } = useAppContext();
  const [showAiNotice, setShowAiNotice] = useState(false);
  const [isReelsMode, setIsReelsMode] = useState(false);
  const reelsContainerRef = useRef<HTMLDivElement>(null);

  const projectIndex = useMemo(() => 
    PROJECTS.findIndex((p) => p.id === projectId),
    [projectId]
  );
  
  const project = projectIndex !== -1 ? PROJECTS[projectIndex] : null;
  const nextProject = project ? PROJECTS[(projectIndex + 1) % PROJECTS.length] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsReelsMode(false);
    setActiveVideoId(null);
    
    if (projectId === 'the-vision-series') {
      const timer = setTimeout(() => setShowAiNotice(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [projectId, setActiveVideoId]);

  // ============================================================================
  // REELS OBSERVER - SNAP AUTOPLAY
  // ============================================================================
  useEffect(() => {
    if (!isReelsMode || !reelsContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // We only care about the most visible entry
        const visibleEntry = entries.find(e => e.isIntersecting);
        if (visibleEntry) {
          const id = visibleEntry.target.getAttribute('data-reel-id');
          if (id) setActiveVideoId(id);
        }
      },
      {
        root: reelsContainerRef.current,
        threshold: 0.6, // Trigger as soon as the video is majority-visible
      }
    );

    const elements = reelsContainerRef.current.querySelectorAll('[data-reel-id]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isReelsMode, setActiveVideoId]);

  if (!project || !nextProject) return null;

  const enterReelsMode = () => {
    setIsGlobalMuted(false); 
    setIsReelsMode(true);
    const firstId = `reel-${projectId}-0`;
    setActiveVideoId(firstId);
    document.body.style.overflow = 'hidden';
  };

  const exitReelsMode = () => {
    setIsReelsMode(false);
    setActiveVideoId(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <motion.div initial="hidden" animate="visible" className="bg-background text-accent min-h-screen">
      
      {/* REELS MODE OVERLAY */}
      <AnimatePresence>
        {isReelsMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black"
          >
            <button 
              onClick={exitReelsMode}
              className="fixed top-8 right-8 z-[210] p-4 bg-white/5 backdrop-blur-3xl rounded-full text-white hover:bg-white hover:text-black transition-all shadow-2xl"
            >
              <X size={24} />
            </button>

            <div 
              ref={reelsContainerRef}
              className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
            >
              {project.gallery?.map((item, idx) => {
                const reelId = `reel-${projectId}-${idx}`;
                return (
                  <div 
                    key={idx} 
                    data-reel-id={reelId}
                    className="h-screen w-full snap-start relative flex items-center justify-center overflow-hidden"
                  >
                    <div className="w-full h-full md:max-w-[420px] md:h-[88vh] aspect-[9/16] bg-neutral-900 shadow-[0_0_100px_rgba(0,0,0,1)] md:rounded-[2.5rem] overflow-hidden">
                      <VideoPlayer 
                        type={item.type as 'youtube' | 'local'} 
                        src={item.src} 
                        autoplay={idx === 0}
                        isReelsMode={true}
                        reelId={reelId}
                      />
                    </div>
                    
                    <div className="absolute bottom-12 left-8 md:left-[calc(50%-180px)] pointer-events-none z-20 max-w-[280px]">
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <span className="text-[10px] uppercase tracking-[0.4em] font-mono text-white/30 drop-shadow-md">
                          Artifact // 0{idx + 1}
                        </span>
                        <h4 className="text-xl font-black uppercase tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                          {item.label || project.title}
                        </h4>
                      </motion.div>
                    </div>

                    {idx === 0 && (
                      <motion.div 
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 pointer-events-none"
                      >
                        <ChevronDown size={24} />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STANDARD PROJECT VIEW */}
      <section className="pt-32 px-6">
        <div className="container mx-auto">
            {project.isSeries ? (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-[10px] uppercase tracking-[0.4em] font-mono opacity-50">Active Series</span>
                    </div>
                    <h1 className="text-4xl md:text-[8vw] font-black uppercase tracking-tighter leading-[0.85]">{project.title}</h1>
                  </div>
                  
                  <button 
                    onClick={enterReelsMode}
                    className="group relative flex items-center gap-4 bg-accent text-background px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
                  >
                    <Zap size={16} fill="currentColor" />
                    Enter Reels Mode
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.gallery?.map((item, idx) => {
                    const reelId = `gallery-${project.id}-${idx}`;
                    return (
                      <motion.div key={idx} variants={fadeUp} className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-primary shadow-2xl">
                        <VideoPlayer 
                          type={item.type as 'youtube' | 'local'} 
                          src={item.src} 
                          autoplay={false} 
                          reelId={reelId}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <motion.div layoutId={`project-container-${project.id}`} className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-primary shadow-2xl">
                    <VideoPlayer {...project.heroVideo} showControls={true} reelId={`hero-${project.id}`} />
                </motion.div>
                <h1 className="text-4xl md:text-[10vw] font-black uppercase tracking-tighter leading-[0.85]">{project.title}</h1>
              </div>
            )}
        </div>
      </section>

      <section className="py-32 px-6 border-t border-white/5 mt-32">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">Archive_Ref</span>
              <p className="text-neutral-400 leading-relaxed text-lg">{project.description}</p>
            </div>
            <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-accent/40 font-mono">Software_Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.details.techStack.map(t => (
                    <span key={t} className="px-4 py-2 bg-white/5 rounded-full text-[10px] uppercase tracking-widest border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
          </div>
          <div className="lg:col-span-8">
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-4 text-accent/30">
                <Terminal size={20} />
                <span className="text-[10px] uppercase tracking-[0.6em] font-mono">Process_Analysis</span>
              </div>
              <p className="text-xl md:text-4xl text-neutral-200 font-light leading-tight italic">
                "{project.details.analysis}"
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 pt-32 pb-40 px-6 text-center">
        <Link to={`/portfolio/${nextProject.id}`} className="group space-y-8 block">
          <span className="text-[10px] uppercase tracking-[1em] text-neutral-600 block">Next_Artifact</span>
          <h2 className="text-4xl md:text-[10vw] font-black uppercase tracking-tighter leading-none group-hover:tracking-normal transition-all duration-1000">
            {nextProject.title}
          </h2>
          <div className="flex justify-center pt-8">
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-background transition-all"
            >
              <ArrowLeft size={24} className="rotate-[135deg]" />
            </motion.div>
          </div>
        </Link>
      </section>
      
      <footer className="py-20 text-center opacity-20 hover:opacity-100 transition-opacity">
        <Link to="/portfolio" className="text-[10px] uppercase tracking-[0.5em] font-mono inline-flex items-center gap-4">
          <ArrowLeft size={12} /> Return to archive
        </Link>
      </footer>
    </motion.div>
  );
};

export default ProjectDetail;
