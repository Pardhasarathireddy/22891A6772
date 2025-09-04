// src/pages/StatisticsPage.js
import React, { useState, useEffect } from 'react';
import UrlStatistics from '../components/UrlStatistics';

function StatisticsPage() {
  const [urlStats, setUrlStats] = useState([]);

  useEffect(() => {
    // Fetch statistics (in real case, you might fetch from API or use localStorage)
    const savedUrls = Object.keys(localStorage)
      .filter(key => key.startsWith("https://short.ly/"))  // Filter only shortened URLs
      .map(key => JSON.parse(localStorage.getItem(key)));

    setUrlStats(savedUrls);
  }, []);

  return (
    <div>
      <UrlStatistics urlStats={urlStats} />
    </div>
  );
}

export default StatisticsPage;
