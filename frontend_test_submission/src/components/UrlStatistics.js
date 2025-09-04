// src/components/UrlStatistics.js
import React from 'react';
import { Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

function UrlStatistics({ urlStats }) {
  return (
    <div>
      <Typography variant="h6">Click Statistics:</Typography>
      <Paper style={{ padding: '20px' }}>
        <List>
          {urlStats.map((url, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`Short URL: ${url.shortUrl}`}
                secondary={`Total Clicks: ${url.clicks}`}
              />
              <ListItemText
                secondary={`Created: ${url.created}, Expires: ${url.expiry}`}
              />
              <ListItemText
                secondary={`Click Details: ${url.clickDetails.map((click, idx) => (
                  <div key={idx}>Timestamp: {click.timestamp} - Location: {click.location}</div>
                ))}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </div>
  );
}

export default UrlStatistics;
