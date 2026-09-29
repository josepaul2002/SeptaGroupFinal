import UploadActivity from './components/admin/UploadActivity';
import MotionProvider from './components/MotionProvider';
import HashNavigation from './components/HashNavigation';
import MobileContactBar from './components/MobileContactBar';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { LanguageProvider } from './components/LanguageToggle';
import PageMetadata from './components/PageMetadata';
import PageAvailability from './components/PageAvailability';
import LeadersPage from './pages/LeadersPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import SearchLandingPage from './pages/SearchLandingPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectCaseStudyPage from './pages/ProjectCaseStudyPage';
import ContactPage from './pages/ContactPage';
import AdminRecoveryPage from './pages/AdminRecoveryPage';
import AdminPage from './pages/AdminPage';
import ContentChecklist from './pages/ContentChecklist';
import EcosystemPage from './pages/EcosystemPage';
import PartnerProfilePage from './pages/PartnerProfilePage';
import PartnerProfileBoundary from './components/PartnerProfileBoundary';
import CollaboratorReviewPage from './pages/CollaboratorReviewPage';
import PagePreview from './pages/PagePreview';

function PublicChrome({children}) {
  const {pathname}=useLocation();
  const internal=pathname.startsWith('/admin')||pathname.startsWith('/review/')||pathname==='/content-checklist';
  return <>{!internal&&<Navbar/>}<main id="main-content">{children}</main>{!internal&&<><Footer/><WhatsAppButton/><MobileContactBar/></>}</>;
}

function CollaboratorRedirect() {
  const {slug}=useParams();
  return <Navigate to={`/ecosystem/${encodeURIComponent(slug)}`} replace/>;
}

function CollaboratorProfileRoute(){
  const {slug}=useParams();
  return <PartnerProfileBoundary key={slug}><PartnerProfilePage/></PartnerProfileBoundary>;
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter><MotionProvider><HashNavigation/>
        <div className="min-h-screen bg-[#F6F6F3] font-inter">
          <PageMetadata />
          <PublicChrome>
            <UploadActivity/><PageAvailability><Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<SearchLandingPage kind="service" />} />
              <Route path="/locations/:slug" element={<SearchLandingPage kind="location" />} />
              <Route path="/solution-packs" element={<Navigate to="/services" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectCaseStudyPage />} />
              <Route path="/ecosystem" element={<EcosystemPage />} />
              <Route path="/ecosystem/:slug" element={<CollaboratorProfileRoute />} />
              <Route path="/collaborators" element={<Navigate to="/ecosystem" replace />} />
              <Route path="/collaborators/:slug" element={<CollaboratorRedirect />} />
              <Route path="/review/collaborator/:token" element={<CollaboratorReviewPage />} />
              <Route path="/admin/page-preview" element={<PagePreview />} />
              <Route path="/project-leaders" element={<LeadersPage />} />
              <Route path="/project-leaders/:slug" element={<LeadersPage />} />
              <Route path="/privacy" element={<div className="max-w-3xl mx-auto px-6 pt-32 pb-24"><h1 className="text-4xl mb-8">Enquiry privacy</h1><p>We use the contact and project details you submit to respond to your enquiry and coordinate requested introductions. Please avoid submitting sensitive personal information. You can request correction or deletion by replying to our response.</p><p className="mt-6">Do not upload confidential drawings or documents through this website.</p></div>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin/recover" element={<AdminRecoveryPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/content-checklist" element={<ContentChecklist />} />
              <Route path="*" element={<div className="pt-32 px-6 pb-24"><h1 className="text-4xl">Page not found</h1><a href="/">Return to Septa</a></div>} />
            </Routes></PageAvailability>
          </PublicChrome>
        </div>
      </MotionProvider></BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
