import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const CRUDRoute = () => {
  const { user, loading, canCRUD } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Hanya Admin, Toolman, dan Kepala Lab yang bisa melakukan CRUD
  return canCRUD() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default CRUDRoute;