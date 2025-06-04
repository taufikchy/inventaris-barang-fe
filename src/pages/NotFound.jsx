import { Box, Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: { xs: '6rem', md: '8rem' }, fontWeight: 700, color: 'primary.main' }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Halaman Tidak Ditemukan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
          Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan, dihapus, atau URL yang Anda masukkan salah.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
          sx={{ px: 4, py: 1.2 }}
        >
          Kembali ke Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;