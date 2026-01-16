
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Loader2, Filter } from 'lucide-react';
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

  // Dynamically extract unique technologies from current projects
  const availableTechs = useMemo(() => {
    const techs = new Set<string>();
    PROJECTS.forEach(p => p.details.techStack.forEach(t => techs.add(t)));
    return Array.from(techs).sort();
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
          <div className="mb-12 md:mb-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <motion.span variants={itemVariants} className="text-[9px] uppercase tracking-[0.5em] text-neutral-600 font-mono block">
                    Archive_Index // 2024-25
                  </motion.span>
                  <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                      Selected <br className="hidden md:block" /> <span className="text-neutral-800">Artifacts</span>
                  </motion.h1>
                </div>
                
                <motion.div variants={itemVariants} className="flex items-center gap-4 text-neutral-700 font-mono text-[10px] uppercase tracking-widest">
                  <div className="h-[1px] w-8 bg-white/5" />
                  <span>Showing {displayedProjects.length} of {PROJECTS.length}</span>
                </motion.div>
              </div>
          </div>

          {/* New Command Center Layout */}
          <div className="mb-16 md:mb-24 space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              
              {/* Refined Search */}
              <motion.div variants={itemVariants} className="relative w-full lg:max-w-md group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-neutral-600 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Scan directory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 pl-12 pr-12 py-4 text-accent placeholder-neutral-700 focus:outline-none focus:border-accent/20 focus:bg-white/[0.04] rounded-xl transition-all text-[11px] uppercase tracking-wider"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-accent transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>

              {/* Pill Filters */}
              <motion.div variants={itemVariants} className="w-full overflow-hidden relative">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                  <button
                    onClick={() => setSelectedTech(null)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all border ${!selectedTech ? 'bg-accent text-background border-accent' : 'bg-transparent text-neutral-600 border-white/5 hover:border-white/20'}`}
                  >
                    All_Stacks
                  </button>
                  {availableTechs.map(tech => (
                    <button
                      key={tech}
                      onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all border ${selectedTech === tech ? 'bg-accent text-background border-accent' : 'bg-transparent text-neutral-600 border-white/5 hover:border-white/20 hover:text-neutral-400'}`}
                    >
                      {tech.replace(' ', '_')}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Sort Dropdown */}
              <motion.div variants={itemVariants} className="relative flex-shrink-0" ref={sortRef}>
                <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-4 text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-white/[0.04] ${sortBy !== 'default' ? 'text-accent border-accent/20' : 'text-neutral-500'}`}
                >
                    <Filter size={14} className="opacity-40" />
                    <span className="font-bold">{sortLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-40 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isSortOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 right-0 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl p-1"
                        >
                            {sortOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                    className={`px-4 py-3 text-[10px] uppercase tracking-widest cursor-pointer rounded-xl transition-all ${sortBy === option.value ? 'bg-accent text-background font-black' : 'text-neutral-500 hover:text-accent hover:bg-white/5'}`}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
              </motion.div>
            </div>
            
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-center"
                >
                  <button 
                    onClick={resetFilters}
                    className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neutral-600 hover:text-accent transition-colors py-2 border-b border-white/5 hover:border-accent/40"
                  >
                    <X size={10} />
                    Reset Archive Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Project List */}
          <motion.div 
              className="flex flex-col items-center gap-12 md:gap-32 max-w-5xl mx-auto"
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
                  className="w-full pt-16 flex flex-col items-center gap-6 opacity-20 group hover:opacity-100 transition-opacity duration-700"
                >
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="text-accent/20"
                      >
                        <Loader2 className="w-12 h-12 md:w-16 md:h-16" strokeWidth={0.5} />
                      </motion.div>
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.6em] font-mono text-neutral-500">
                        Synthesizing_Future_Artifacts
                      </h4>
                    </div>
                </motion.div>
              )}
              
              {displayedProjects.length === 0 && (
                   <div className="text-center py-40 w-full space-y-8">
                      <div className="relative inline-block">
                        <Loader2 className="w-12 h-12 text-neutral-900 mx-auto" strokeWidth={1} />
                        <X className="absolute inset-0 m-auto w-4 h-4 text-neutral-700" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] md:text-sm text-neutral-600 uppercase tracking-[0.4em] font-mono">
                          Search sequence returned zero results.
                        </p>
                        <button 
                          onClick={resetFilters}
                          className="text-accent text-[9px] uppercase tracking-widest border-b border-accent/20 hover:border-accent transition-colors pb-1"
                        >
                          Clear Archive Filters
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
