import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '@/App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectCaseStudyPage from './pages/ProjectCaseStudyPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import ContentChecklist from './pages/ContentChecklist';

function App() {
  return (
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
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/content-checklist" element={<ContentChecklist />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}

export default App;
