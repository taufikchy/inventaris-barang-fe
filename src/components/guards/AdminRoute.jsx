import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const AdminRoute = () => {
  const { user, loading, isKepalaLab } = useAuth();

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

  // Hanya Kepala Lab yang memiliki akses penuh
  return isKepalaLab() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;