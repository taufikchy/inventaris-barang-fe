import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/id';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Barang from './pages/Barang';
import DetailBarang from './pages/DetailBarang';
import Kategori from './pages/Kategori';
import Lokasi from './pages/Lokasi';
import Peminjaman from './pages/Peminjaman';
import DetailPeminjaman from './pages/DetailPeminjaman';
import HistoriTransaksi from './pages/Transaksi';
import TransaksiInventaris from './pages/TransaksiInventaris';
import Pengguna from './pages/Pengguna';
import Laporan from './pages/Laporan';
import HistoriAktivitas from './pages/HistoriAktivitas';
import NotFound from './pages/NotFound';

// Guards
import PrivateRoute from './components/guards/PrivateRoute';
import AdminRoute from './components/guards/AdminRoute';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#22c55e',
    },
    warning: {
      main: '#f59e0b',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
          '&:hover': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
        <CssBaseline />
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/barang" element={<Barang />} />
              <Route path="/barang/:id" element={<DetailBarang />} />
              <Route path="/kategori" element={<Kategori />} />
              <Route path="/lokasi" element={<Lokasi />} />
              <Route path="/peminjaman" element={<Peminjaman />} />
              <Route path="/peminjaman/:id" element={<DetailPeminjaman />} />
              <Route path="/peminjaman/:id/edit" element={<DetailPeminjaman />} />
              <Route path="/transaksi" element={<HistoriTransaksi />} />
              <Route path="/transaksi-inventaris" element={<TransaksiInventaris />} />
              <Route path="/histori-aktivitas" element={<HistoriAktivitas />} />
              <Route path="/laporan" element={<Laporan />} />
              
              {/* Admin, Toolman, Kepala Lab, dan Sarana Routes */}
              <Route path="/pengguna" element={<Pengguna />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;