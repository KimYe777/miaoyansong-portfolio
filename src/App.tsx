import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { AboutPage } from './pages/AboutPage';
import { ClearSenseModelPage } from './pages/ClearSenseModelPage';
import { ClearSenseUiPage } from './pages/ClearSenseUiPage';
import { HomePage } from './pages/HomePage';
import { NightCareExperiencePage } from './pages/NightCareExperiencePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RentEyeUiPage, WanderUiPage } from './pages/ProjectUiPage';
import { ProjectPage } from './pages/ProjectPage';
import { RijiExperiencePage } from './pages/RijiExperiencePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isExperienceRoute = location.pathname.startsWith('/experience/');
  const isAboutRoute = location.pathname === '/about';

  return (
    <div className={`app-shell${isExperienceRoute ? ' is-experience-shell' : ''}`}>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <ScrollToTop />
      {!isExperienceRoute && <SiteHeader />}
      <div id="main-content" className="route-frame" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="/experience/clearsense-model" element={<ClearSenseModelPage />} />
          <Route path="/experience/clearsense-ui" element={<ClearSenseUiPage />} />
          <Route path="/experience/nightcare" element={<NightCareExperiencePage />} />
          <Route path="/experience/riji" element={<RijiExperiencePage />} />
          <Route path="/experience/renteye-ui" element={<RentEyeUiPage />} />
          <Route path="/experience/wander-ui" element={<WanderUiPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!isExperienceRoute && !isAboutRoute && <SiteFooter />}
    </div>
  );
}
