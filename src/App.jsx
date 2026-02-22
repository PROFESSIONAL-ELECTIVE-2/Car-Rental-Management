import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx';
import Home from './pages/Home.jsx'; // Import the new Home page

function App() {
  return (
    <Router>
      {/* Wrapper to ensure Footer stays at the bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        <Header />
        
        {/* Main content area expands to fill space */}
        <main style={{ flex: 1 }}>
          <Routes>
            {/* The Home component will show when you are on the "/" URL */}
            <Route path="/" element={<Home />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;