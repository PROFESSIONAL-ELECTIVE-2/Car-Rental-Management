import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Layout/Header.jsx';
import Footer from './components/Layout/Footer.jsx'; 

function App() {
  return (
    <Router>
      <Header />
      <main style={{ padding: '20px' }}>
        <h2>The Header is working!</h2>
      </main>
      {/* This is where you use the tag, not in the import above */}
      <Footer /> 
    </Router>
  );
}

export default App;