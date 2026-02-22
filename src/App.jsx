import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from './Header.jsx';

function App() {
  return (
    <Router>
      <Header />
      <main style={{ padding: '20px' }}>
        <h2>The Header is working!</h2>
      </main>
    </Router>
  );
}

export default App;