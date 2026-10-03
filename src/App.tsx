import { HashRouter as BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import SponsorshipTiers from './components/SponsorshipTiers';
import SponsorsCarousel from './components/SponsorsCarousel';
import Credibility from './components/Credibility';
import Team from './components/Team';
import SponsorLogos from './components/SponsorLogos';
import PhotosCarousel from './components/PhotosCarousel';
import Competitions from './components/Competitions';
import Newsletter from './components/Newsletter';
import SupportCall from './components/SupportCall';
import Footer from './components/Footer';
import SponsorForm from './pages/SponsorForm';
import DonateForm from './pages/DonateForm';
import AdminCenter from './pages/AdminCenter';
import CompetitionDetail from './pages/CompetitionDetail';
import Unsubscribe from './pages/Unsubscribe';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <SponsorLogos />
            <About />
            <SponsorshipTiers />
            <SponsorsCarousel />
            <Credibility />
            <Team />
            <Competitions />
            <PhotosCarousel />
            <Newsletter />
            <SupportCall />
          </>
        } />
        <Route path="/sponsor" element={<SponsorForm />} />
        <Route path="/donate" element={<DonateForm />} />
        <Route path="/admin" element={<AdminCenter />} />
        <Route path="/competition/:id" element={<CompetitionDetail />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}