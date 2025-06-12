import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Container, useMediaQuery, useTheme } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const drawerWidth = 240;

const MainLayout = () => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header open={open} setOpen={setOpen} />
      <Sidebar open={open} setOpen={setOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2 },
          ml: { 
            xs: 0, 
            md: open ? `${drawerWidth - 240}px` : 0 
          },
          width: {
            xs: '100%',
            md: open ? `calc(100% - ${drawerWidth - 240}px)` : '100%'
          },
          transition: (theme) =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Toolbar /> {/* This is for spacing below the app bar */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: 2,
            px: { xs: 0.5, sm: 1 },
            width: '100%',
            maxWidth: '100% !important'
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;