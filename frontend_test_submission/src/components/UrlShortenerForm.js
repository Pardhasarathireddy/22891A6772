import React, { useState } from 'react';
import { TextField, Button, Grid, Snackbar, Alert, Typography, CircularProgress } from '@mui/material';
import { isValidUrl, isValidShortcode, isValidValidity } from '../utils/validation';
import { logEvent } from '../utils/logger';

function UrlShortenerForm({ onSubmit }) {
  const [longUrl, setLongUrl] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [validity, setValidity] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate the URL and other inputs
    if (!isValidUrl(longUrl)) {
      setErrorMessage('Invalid URL');
      setLoading(false);
      return;
    }

    if (shortcode && !isValidShortcode(shortcode)) {
      setErrorMessage('Invalid shortcode');
      setLoading(false);
      return;
    }

    if (validity && !isValidValidity(validity)) {
      setErrorMessage('Validity period must be between 1 and 1440 minutes');
      setLoading(false);
      return;
    }

    const newUrl = {
      longUrl,
      shortUrl: `https://short.ly/${shortcode || Math.random().toString(36).substring(7)}`,
      expiry: new Date(Date.now() + (validity || 30) * 60000).toISOString(),
    };

    // Save the shortened URL in localStorage
    localStorage.setItem(newUrl.shortUrl, JSON.stringify(newUrl));

    // Log the event (optional)
    logEvent('Shortened URL Created', newUrl);

    // Set shortened URL in state
    setShortenedUrl(newUrl.shortUrl);

    // Reset form fields
    setLongUrl('');
    setShortcode('');
    setValidity('');
    setLoading(false);
  };

  return (
    <div className="container">
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Enter Long URL"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Custom Shortcode (Optional)"
              value={shortcode}
              onChange={(e) => setShortcode(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Validity (in minutes)"
              type="number"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Shorten URL'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {errorMessage && (
        <Snackbar open={true} autoHideDuration={3000} onClose={() => setErrorMessage('')}>
          <Alert onClose={() => setErrorMessage('')} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>
      )}

      {shortenedUrl && (
        <div className="shortened-url">
          <Typography variant="h6" gutterBottom>
            Shortened URL:
          </Typography>
          <TextField
            value={shortenedUrl}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
          />
        </div>
      )}
    </div>
  );
}

export default UrlShortenerForm;
