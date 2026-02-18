import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { LanguageProvider } from './components/LanguageToggle';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectCaseStudyPage from './pages/ProjectCaseStudyPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import ContentChecklist from './pages/ContentChecklist';
import EcosystemPage from './pages/EcosystemPage';
import PartnerProfilePage from './pages/PartnerProfilePage';
import SolutionPacksPage from './pages/SolutionPacksPage';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F3F0E8] font-inter">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectCaseStudyPage />} />
              <Route path="/ecosystem" element={<EcosystemPage />} />
              <Route path="/ecosystem/:slug" element={<PartnerProfilePage />} />
              <Route path="/solution-packs" element={<SolutionPacksPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/content-checklist" element={<ContentChecklist />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
