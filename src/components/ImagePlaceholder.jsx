import React from 'react';
import { Box, Typography } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

const ImagePlaceholder = ({ width = 400, height = 300, text = 'No Image' }) => {
  return (
    <Box
      sx={{
        width: width,
        height: height,
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
      }}
    >
      <ImageIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
};

// Generate data URL for SVG placeholder
export const generatePlaceholderDataUrl = (width = 400, height = 300, text = 'No Image') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
      <g transform="translate(${width/2}, ${height/2})">
        <circle cx="0" cy="-10" r="20" fill="#bdbdbd"/>
        <rect x="-15" y="-5" width="30" height="20" rx="3" fill="#bdbdbd"/>
        <text x="0" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#757575">${text}</text>
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export default ImagePlaceholder;