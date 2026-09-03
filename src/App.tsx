import { HashRouter as BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
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
        <Route path="/" element={<Home />} />
        <Route path="/sponsor" element={<SponsorForm />} />
        <Route path="/donate" element={<DonateForm />} />
        <Route path="/admin" element={<AdminCenter />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
      </Routes>
    </BrowserRouter>
  );
}
