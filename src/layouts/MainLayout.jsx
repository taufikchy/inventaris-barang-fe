import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Container } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const drawerWidth = 5;

const MainLayout = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header open={open} setOpen={setOpen} />
      <Sidebar open={open} setOpen={setOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          ml: { md: open ? `${drawerWidth}px` : 0 },
          mr: 2,
          transition: (theme) =>
            theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Toolbar /> {/* This is for spacing below the app bar */}
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;