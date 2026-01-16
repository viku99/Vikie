
import React, { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, Terminal } from 'lucide-react';
import { PROJECTS } from '../constants';
import VideoPlayer from '../components/VideoPlayer';

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

  const projectIndex = useMemo(() => 
    PROJECTS.findIndex((p) => p.id === projectId),
    [projectId]
  );
  
  const project = projectIndex !== -1 ? PROJECTS[projectIndex] : null;
  const nextProject = project ? PROJECTS[(projectIndex + 1) % PROJECTS.length] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  if (!project || !nextProject) return null;

  return (
    <motion.div initial="hidden" animate="visible" className="bg-background text-accent min-h-screen">
      
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.gallery?.map((item, idx) => (
                    <motion.div key={idx} variants={fadeUp} className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-primary shadow-2xl">
                      <VideoPlayer 
                        type={item.type === 'youtube' ? 'youtube' : 'local'} 
                        src={item.src} 
                        autoplay={idx === 0} 
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <motion.div layoutId={`project-container-${project.id}`} className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-primary shadow-2xl">
                    <VideoPlayer {...project.heroVideo} showControls={true} autoplay={true} />
                </motion.div>
                <h1 className="text-4xl md:text-[10vw] font-black uppercase tracking-tighter leading-[0.85]">{project.title}</h1>
              </div>
            )}
        </div>
      </section>

      {/* DETAILS GRID */}
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

      {/* NEXT PROJECT CALL TO ACTION */}
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
