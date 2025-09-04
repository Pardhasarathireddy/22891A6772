// src/components/ShortenedUrlList.js
import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

function ShortenedUrlList({ urls }) {
  return (
    <div>
      <Typography variant="h6">Shortened URLs:</Typography>
      <List>
        {urls.map((url, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={<a href={url.shortUrl} target="_blank" rel="noopener noreferrer">{url.shortUrl}</a>}
              secondary={`Expires at: ${url.expiry}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default ShortenedUrlList;

