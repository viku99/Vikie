
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Loader2, Filter, Terminal } from 'lucide-react';
import { PROJECTS } from '../constants';
import ProjectCard from '../components/ProjectCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sortOptions = [
    { value: 'default', label: 'Curated' },
    { value: 'year-newest', label: 'Newest' },
    { value: 'title-az', label: 'A-Z' },
];

const Portfolio = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const sortRef = useRef<HTMLDivElement>(null);

  // Dynamically extract unique technologies and their counts
  const techStats = useMemo(() => {
    const counts: Record<string, number> = {};
    PROJECTS.forEach(p => {
      p.details.techStack.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedProjects = useMemo(() => {
    let results = [...PROJECTS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.details.techStack.some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedTech) {
      results = results.filter(p => p.details.techStack.includes(selectedTech));
    }

    switch (sortBy) {
      case 'title-az': return results.sort((a, b) => a.title.localeCompare(b.title));
      case 'year-newest': return results.sort((a, b) => b.details.year - a.details.year);
      default: return results;
    }
  }, [searchQuery, sortBy, selectedTech]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTech(null);
    setSortBy('default');
  };

  const sortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort';
  const hasActiveFilters = searchQuery !== '' || selectedTech !== null || sortBy !== 'default';

  return (
    <div className="bg-background min-h-screen pt-32 md:pt-40">
      <div className="container mx-auto px-6 md:px-8 pb-32">
        <motion.div 
          initial="hidden" 
          animate="visible"
          variants={containerVariants}
        >
          {/* Header Section */}
          <div className="mb-12 md:mb-16 border-b border-white/5 pb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <motion.span variants={itemVariants} className="text-[9px] uppercase tracking-[0.5em] text-neutral-600 font-mono block">
                      Archive_Index // v2.5
                    </motion.span>
                  </div>
                  <motion.h1 variants={itemVariants} className="text-6xl md:text-[10vw] font-black uppercase tracking-tighter leading-[0.8]">
                      Work <br className="hidden md:block" /> <span className="text-neutral-900">Archive</span>
                  </motion.h1>
                </div>
                
                <motion.div variants={itemVariants} className="flex flex-col items-end gap-2 text-neutral-700 font-mono text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <Terminal size={12} className="text-accent/20" />
                    <span>System Status: Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] w-12 bg-white/5" />
                    <span className="text-accent/60">{displayedProjects.length} Fragments Found</span>
                  </div>
                </motion.div>
              </div>
          </div>

          {/* Satisfying Command Center */}
          <div className="mb-20 md:mb-32 space-y-10">
            
            {/* Filter Pills with Shared Layout Animation */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                <button
                  onClick={() => setSelectedTech(null)}
                  className={`relative flex-shrink-0 px-6 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 ${!selectedTech ? 'text-background' : 'text-neutral-600 hover:text-neutral-400'}`}
                >
                  {!selectedTech && (
                    <motion.div 
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-accent rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">All_Artifacts [{PROJECTS.length}]</span>
                </button>
                
                {techStats.map(([tech, count]) => (
                  <button
                    key={tech}
                    onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                    className={`relative flex-shrink-0 px-6 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 ${selectedTech === tech ? 'text-background' : 'text-neutral-600 hover:text-neutral-400'}`}
                  >
                    {selectedTech === tech && (
                      <motion.div 
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-accent rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{tech.replace(' ', '_')} [{count}]</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Terminal Search & Sort Deck */}
            <div className="flex flex-col lg:flex-row gap-4">
              <motion.div variants={itemVariants} className="flex-grow group relative">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <span className="text-accent/30 font-mono text-xs mr-2">$</span>
                  <Search className="w-3.5 h-3.5 text-neutral-700 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Execute search sequence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 pl-16 pr-12 py-5 text-accent placeholder-neutral-800 focus:outline-none focus:border-white/10 focus:bg-white/[0.04] rounded-2xl transition-all text-[11px] uppercase tracking-[0.1em] font-mono"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                   {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-neutral-600 hover:text-accent transition-colors">
                      <X size={14} />
                    </button>
                  )}
                  <div className="w-1.5 h-4 bg-accent/20 animate-pulse rounded-full" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="relative flex-shrink-0" ref={sortRef}>
                <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`h-full flex items-center gap-6 bg-white/[0.02] border border-white/5 px-8 py-5 text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all hover:bg-white/[0.04] font-mono ${sortBy !== 'default' ? 'text-accent border-accent/20' : 'text-neutral-600'}`}
                >
                    <Filter size={12} className="opacity-40" />
                    <span>Sort::{sortLabel}</span>
                    <ChevronDown className={`w-3 h-3 opacity-40 transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isSortOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            className="absolute top-full mt-3 right-0 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-3xl p-2"
                        >
                            {sortOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                    className={`px-5 py-4 text-[9px] uppercase tracking-[0.2em] cursor-pointer rounded-xl transition-all font-mono ${sortBy === option.value ? 'bg-white/10 text-accent' : 'text-neutral-600 hover:text-accent hover:bg-white/5'}`}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Project List */}
          <motion.div 
              className="flex flex-col items-center gap-16 md:gap-40 max-w-5xl mx-auto"
              variants={containerVariants}
          >
              {displayedProjects.map((project) => (
                  <motion.div key={project.id} variants={itemVariants} className="w-full">
                      <ProjectCard project={project} />
                  </motion.div>
              ))}
              
              {displayedProjects.length > 0 && (
                <motion.div 
                  variants={itemVariants}
                  className="w-full pt-16 flex flex-col items-center gap-8 opacity-20 hover:opacity-100 transition-opacity duration-1000"
                >
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] w-12 bg-white/20" />
                      <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.8em] font-mono text-neutral-500">
                        End_Of_Archive
                      </h4>
                      <div className="h-[1px] w-12 bg-white/20" />
                    </div>
                </motion.div>
              )}
              
              {displayedProjects.length === 0 && (
                   <div className="text-center py-40 w-full space-y-10">
                      <div className="relative inline-flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border border-dashed border-white/5 rounded-full scale-150"
                        />
                        <div className="relative bg-white/5 p-8 rounded-full">
                          <Search className="w-10 h-10 text-neutral-800" strokeWidth={1} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] md:text-sm text-neutral-500 uppercase tracking-[0.5em] font-mono">
                          Directory scanning failed. 0 fragments found.
                        </p>
                        <button 
                          onClick={resetFilters}
                          className="px-8 py-3 bg-white/5 text-accent text-[9px] uppercase tracking-widest rounded-full border border-white/10 hover:bg-accent hover:text-background transition-all"
                        >
                          Reset System Parameters
                        </button>
                      </div>
                  </div>
              )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;
