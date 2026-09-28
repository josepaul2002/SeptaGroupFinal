import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { LanguageProvider } from './components/LanguageToggle';
import PageMetadata from './components/PageMetadata';
import LeadersPage from './pages/LeadersPage';
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
import PagePreview from './pages/PagePreview';

function PublicChrome({children}) {
  const {pathname}=useLocation();
  const internal=pathname.startsWith('/admin')||pathname==='/content-checklist';
  return <>{!internal&&<Navbar/>}<main id="main-content">{children}</main>{!internal&&<><Footer/><WhatsAppButton/></>}</>;
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F6F6F3] font-inter">
          <PageMetadata />
          <PublicChrome>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/solution-packs" element={<Navigate to="/services" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectCaseStudyPage />} />
              <Route path="/ecosystem" element={<EcosystemPage />} />
              <Route path="/ecosystem/:slug" element={<PartnerProfilePage />} />
              <Route path="/admin/page-preview" element={<PagePreview />} />
              <Route path="/project-leaders" element={<LeadersPage />} />
              <Route path="/project-leaders/:slug" element={<LeadersPage />} />
              <Route path="/privacy" element={<div className="max-w-3xl mx-auto px-6 pt-32 pb-24"><h1 className="text-4xl mb-8">Enquiry privacy</h1><p>We use the contact and project details you submit to respond to your enquiry and coordinate requested introductions. Please avoid submitting sensitive personal information. You can request correction or deletion by replying to our response.</p><p className="mt-6">Do not upload confidential drawings or documents through this website.</p></div>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/content-checklist" element={<ContentChecklist />} />
              <Route path="*" element={<div className="pt-32 px-6 pb-24"><h1 className="text-4xl">Page not found</h1><a href="/">Return to Septa</a></div>} />
            </Routes>
          </PublicChrome>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
