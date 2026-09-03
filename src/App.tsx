import { HashRouter as BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import SponsorshipTiers from './components/SponsorshipTiers';
import SponsorsCarousel from './components/SponsorsCarousel';
import Credibility from './components/Credibility';
import Team from './components/Team';
import By from './components/By';
import PhotosCarousel from './components/PhotosCarousel';
import Newsletter from './components/Newsletter';
import SupportCall from './components/SupportCall';
import Footer from './components/Footer';
import SponsorForm from './pages/SponsorForm';
import DonateForm from './pages/DonateForm';
import AdminCenter from './pages/AdminCenter';
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
            <About />
            <SponsorshipTiers />
            <SponsorsCarousel />
            <Credibility />
            <Team />
            <By />
            <PhotosCarousel />
            <Newsletter />
            <SupportCall />
          </>
        } />
        <Route path="/sponsor" element={<SponsorForm />} />
        <Route path="/donate" element={<DonateForm />} />
        <Route path="/admin" element={<AdminCenter />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}