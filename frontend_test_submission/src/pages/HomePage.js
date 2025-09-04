// src/pages/HomePage.js
import React, { useState } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import UrlShortenerForm from '../components/UrlShortenerForm';
import ShortenedUrlList from '../components/ShortenedUrlList';

function HomePage() {
  const [shortUrls, setShortUrls] = useState([]);
  
  const handleShortenUrl = (newUrl) => {
    setShortUrls([...shortUrls, newUrl]);
    // Save the shortened URL in localStorage for persistence
    localStorage.setItem(newUrl.shortUrl, JSON.stringify(newUrl));
  };

  return (
    <Container>
      <Typography variant="h3" gutterBottom>
        URL Shortener
      </Typography>
      <Paper style={{ padding: '20px' }}>
        <UrlShortenerForm onSubmit={handleShortenUrl} />
        <ShortenedUrlList urls={shortUrls} />
      </Paper>
    </Container>
  );
}

export default HomePage;
