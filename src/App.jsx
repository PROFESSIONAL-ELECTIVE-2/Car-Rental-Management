import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';
import Home from './pages/Home.jsx'; 
import Rent from './pages/Rent.jsx';
import Contact from './pages/ContactUs.jsx'; 
import AboutUs from './pages/About.jsx'; 

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>  
        <Header />
        <main style={{ flex: 1, paddingTop: '80px' }}> 
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fleet" element={<Rent />} /> 
            <Route path="/contact" element={<Contact />} /> 
            <Route path="/about" element={<AboutUs />} /> 
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;