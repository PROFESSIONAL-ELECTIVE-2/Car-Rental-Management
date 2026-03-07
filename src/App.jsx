import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Rent from './pages/Rent.jsx';
import Contact from './pages/ContactUs.jsx';
import AboutUs from './pages/About.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

/**
 * PublicLayout
 * Wraps public-facing pages with the shared Header and Footer.
 * Admin pages are rendered outside this wrapper so they get their
 * own full-screen layout (sidebar, etc.) without the public nav.
 */
function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, paddingTop: '80px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/fleet"   element={<PublicLayout><Rent /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/about"   element={<PublicLayout><AboutUs /></PublicLayout>} />

        <Route path="/admin/login"      element={<AdminLogin />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;