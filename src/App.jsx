import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Layout/Header.jsx'; // Corrected import path and type
import Footer from './components/Layout/Footer.jsx'
import Card from './features/Card.jsx'
import Button from './components/Commons/Button.jsx'

function App() {
  return (
    <Router>
      <Header />
      <main style={{ padding: '20px' }}>
        <h2>The Header is working!</h2>
      </main>
      <Footer />
      <Card />
      <Button />
    </Router>
  );
}

export default App;