import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Rent from './pages/Rent.jsx';
import Contact from './pages/ContactUs.jsx';
import AboutUs from './pages/About.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1, paddingTop: '70px' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/fleet" element={<Rent />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/admin/login" element={<AdminLogin />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;