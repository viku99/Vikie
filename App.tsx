
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop';
import AboutWebsite from './pages/AboutWebsite';
import { PROJECTS, SITE_INFO } from './constants';

const PageMetadataManager = () => {
  const { pathname } = useLocation();
  const { projectId } = useParams();

  useEffect(() => {
    let title = "Vikas Bala | Motion Storyteller";
    let description = SITE_INFO.description;
    
    if (pathname === "/") {
      title = "Vikas Bala | Designing Attention Through Movement";
    } else if (pathname === "/portfolio") {
      title = "Portfolio | Selected Motion Works by Vikas Bala";
      description = "Explore a curated archive of motion graphics, cinematic edits, and rhythmic storytelling projects.";
    } else if (pathname === "/about") {
      title = "About | The Philosophy of Vikas Bala";
      description = "Meet Vikas Bala, a motion designer obsessed with frame-perfect timing and cinematic emotion.";
    } else if (pathname === "/contact") {
      title = "Contact | Start a Motion Project";
      description = "Get in touch with Vikas Bala for collaborations in high-end motion design and video editing.";
    } else if (pathname === "/about-this-site") {
      title = "The Blueprint | Building a Modern Portfolio";
      description = "A deep dive into the technology and philosophy behind this motion-first digital experience.";
    } else if (projectId) {
      const project = PROJECTS.find(p => p.id === projectId);
      if (project) {
        title = `${project.title} | ${project.category}`;
        description = project.description;
      }
    }

    document.title = title;
    
    // Update Meta Tags for SEO
    const updateMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
  }, [pathname, projectId]);

  return null;
};

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <PageMetadataManager />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:projectId" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/about-this-site" element={<AboutWebsite />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
