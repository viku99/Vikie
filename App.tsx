
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
import { PROJECTS } from './constants';

const PageTitleManager = () => {
  const { pathname } = useLocation();
  const { projectId } = useParams();

  useEffect(() => {
    let title = "Vikas Bala | Motion Storyteller";
    
    if (pathname === "/") {
      title = "Vikas Bala | Designing Attention Through Movement";
    } else if (pathname === "/portfolio") {
      title = "Portfolio | Selected Motion Works by Vikas Bala";
    } else if (pathname === "/about") {
      title = "About | The Philosophy of Vikas Bala";
    } else if (pathname === "/contact") {
      title = "Contact | Start a Motion Project";
    } else if (pathname === "/about-this-site") {
      title = "The Blueprint | Building a Modern Portfolio";
    } else if (projectId) {
      const project = PROJECTS.find(p => p.id === projectId);
      if (project) {
        title = `${project.title} | ${project.category}`;
      }
    }

    document.title = title;
  }, [pathname, projectId]);

  return null;
};

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <PageTitleManager />
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
