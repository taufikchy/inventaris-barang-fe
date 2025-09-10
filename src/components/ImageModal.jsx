import React from 'react';
import {
  Modal,
  Box,
  IconButton,
  Fade,
  Backdrop
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { useState } from 'react';

const ImageModal = ({ open, onClose, imageUrl, altText = 'Preview Image' }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onClick={handleBackdropClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Control Buttons */}
          <Box
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              zIndex: 1
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <ZoomOutIcon />
            </IconButton>
            
            <IconButton
              onClick={handleResetZoom}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              <FullscreenIcon />
            </IconButton>
            
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <ZoomInIcon />
            </IconButton>
            
            <IconButton
              onClick={handleClose}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Zoom Level Indicator */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: '0.875rem',
              zIndex: 1
            }}
          >
            {Math.round(zoom * 100)}%
          </Box>

          {/* Image */}
          <Box
            component="img"
            src={imageUrl}
            alt={altText}
            sx={{
              maxWidth: zoom === 1 ? '90%' : 'none',
              maxHeight: zoom === 1 ? '90%' : 'none',
              width: zoom === 1 ? 'auto' : `${zoom * 100}%`,
              height: 'auto',
              objectFit: 'contain',
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default ImageModal;