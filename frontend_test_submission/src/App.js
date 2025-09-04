import React from 'react';
import './App.css'; // Import the CSS file in your component or App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UrlShortenerForm from './components/UrlShortenerForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UrlShortenerForm />} />
        {/* Add any other routes here if needed */}
      </Routes>
    </Router>
  );
}

export default App;
