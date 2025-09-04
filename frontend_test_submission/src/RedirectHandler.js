import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function RedirectHandler() {
  const { shortcode } = useParams(); // Extract the shortcode from the URL path
  const navigate = useNavigate();

  useEffect(() => {
    // Look for the shortened URL in localStorage
    const storedUrl = JSON.parse(localStorage.getItem(`https://short.ly/${shortcode}`));

    if (storedUrl) {
      // If found, redirect to the original long URL
      window.location.href = storedUrl.longUrl;
    } else {
      // If not found, redirect to home or show an error page
      navigate('/');
    }
  }, [shortcode, navigate]);

  return null; // No UI rendered, just handle redirection
}
useEffect(() => {
  const storedUrl = JSON.parse(localStorage.getItem(`https://short.ly/${shortcode}`));
  console.log("Stored URL:", storedUrl); // Add this line to debug

  if (storedUrl) {
    window.location.href = storedUrl.longUrl;
  } else {
    navigate('/');
  }
}, [shortcode, navigate]);

export default RedirectHandler;
