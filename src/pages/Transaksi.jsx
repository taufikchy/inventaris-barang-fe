import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Skeleton,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from '../utils/axios';

const HistoriTransaksi = () => {
  const [historiAktivitas, setHistoriAktivitas] = useState([]);
  const [pengguna, setPengguna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAktivitas, setSelectedAktivitas] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  // Filters
  const [filters, setFilters] = useState({
    jenis_aktivitas: '',
    modul: '',
    tanggal_mulai: null,
    tanggal_akhir: null,
    id_pengguna: '',
    search: ''
  });
  
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  const jenisAktivitasOptions = [
    { value: 'create', label: 'Tambah Data', color: 'success', icon: <HistoryIcon /> },
    { value: 'update', label: 'Ubah Data', color: 'primary', icon: <HistoryIcon /> },
    { value: 'delete', label: 'Hapus Data', color: 'error', icon: <HistoryIcon /> },
    { value: 'login', label: 'Login', color: 'info', icon: <LoginIcon /> },
    { value: 'logout', label: 'Logout', color: 'default', icon: <LogoutIcon /> }
  ];
  
  const modulOptions = [
    { value: 'barang', label: 'Barang', color: 'primary', icon: <ComputerIcon /> },
    { value: 'kategori', label: 'Kategori', color: 'secondary', icon: <CategoryIcon /> },
    { value: 'lokasi', label: 'Lokasi', color: 'info', icon: <LocationIcon /> },
    { value: 'pengguna', label: 'Pengguna', color: 'warning', icon: <PersonIcon /> },
    { value: 'peminjaman', label: 'Peminjaman', color: 'success', icon: <AssignmentIcon /> },
    { value: 'transaksi', label: 'Transaksi', color: 'error', icon: <HistoryIcon /> },
    { value: 'auth', label: 'Autentikasi', color: 'default', icon: <LoginIcon /> }
  ];

  useEffect(() => {
    fetchHistoriAktivitas();
    fetchPengguna();
  }, [page, filters]);

  const fetchHistoriAktivitas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/histori-aktivitas', {
        params: {
          page,
          limit: limit,
          jenis_aktivitas: filters.jenis_aktivitas,
          modul: filters.modul,
          tanggal_mulai: filters.tanggal_mulai ? filters.tanggal_mulai.format('YYYY-MM-DD') : undefined,
          tanggal_akhir: filters.tanggal_akhir ? filters.tanggal_akhir.format('YYYY-MM-DD') : undefined,
          id_pengguna: filters.id_pengguna,
          search: filters.search
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success || response.data.sukses) {
        setHistoriAktivitas(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(Math.ceil(response.data.pagination.total / limit));
      } else {
        console.error('Error fetching activity history:', response.data.message || response.data.pesan);
        showAlert(response.data.message || response.data.pesan, 'error');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activity history:', error);
      showAlert(error.response?.data?.message || error.response?.data?.pesan || 'Gagal memuat data histori aktivitas', 'error');
      setLoading(false);
    }
  };

  const fetchPengguna = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/pengguna/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPengguna(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (aktivitas) => {
    setSelectedAktivitas(aktivitas);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAktivitas(null);
  };

  // Tidak ada fungsi submit karena histori aktivitas hanya untuk melihat data

  // Tidak ada fungsi delete karena histori aktivitas tidak dapat dihapus

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      jenis_aktivitas: '',
      modul: '',
      tanggal_mulai: null,
      tanggal_akhir: null,
      id_pengguna: '',
      search: ''
    });
    setPage(1);
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  const getJenisAktivitasInfo = (jenis) => {
    return jenisAktivitasOptions.find(option => option.value === jenis) || 
           { label: jenis, color: 'default', icon: null };
  };

  const getModulInfo = (modul) => {
    return modulOptions.find(option => option.value === modul) || 
           { label: modul, color: 'default', icon: null };
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 2 }}
          onClose={() => setAlert({ show: false, message: '', severity: 'success' })}
        >
          {alert.message}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Histori Aktivitas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Jenis Aktivitas</InputLabel>
                  <Select
                    value={filters.jenis_aktivitas}
                    label="Jenis Aktivitas"
                    onChange={(e) => handleFilterChange('jenis_aktivitas', e.target.value)}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    {jenisAktivitasOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Modul</InputLabel>
                  <Select
                    value={filters.modul}
                    label="Modul"
                    onChange={(e) => handleFilterChange('modul', e.target.value)}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    {modulOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Tanggal Mulai"
                  value={filters.tanggal_mulai}
                  onChange={(value) => handleFilterChange('tanggal_mulai', value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Tanggal Akhir"
                  value={filters.tanggal_akhir}
                  onChange={(value) => handleFilterChange('tanggal_akhir', value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Pengguna</InputLabel>
                  <Select
                    value={filters.id_pengguna}
                    label="Pengguna"
                    onChange={(e) => handleFilterChange('id_pengguna', e.target.value)}
                  >
                    <MenuItem value="">Semua Pengguna</MenuItem>
                    {pengguna.map(user => (
                       <MenuItem key={user.id} value={user.id}>
                         {user.nama} ({user.nama_pengguna})
                       </MenuItem>
                     ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Cari..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Cari deskripsi aktivitas"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ height: '56px' }}
                >
                  Reset Filter
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Transaction Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Daftar Aktivitas ({totalItems} total)
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Pengguna</TableCell>
                  <TableCell>Jenis Aktivitas</TableCell>
                  <TableCell>Modul</TableCell>
                  <TableCell>Deskripsi</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : historiAktivitas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data histori aktivitas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  historiAktivitas.map((item) => {
                    const jenisInfo = getJenisAktivitasInfo(item.jenis_aktivitas);
                    const modulInfo = getModulInfo(item.modul);
                    
                    return (
                       <TableRow key={item.id} hover>
                         <TableCell>{formatDate(item.waktu_aktivitas)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {item.pengguna?.nama}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                 {item.pengguna?.nama_pengguna}
                               </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={jenisInfo.icon}
                            label={jenisInfo.label}
                            color={jenisInfo.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={modulInfo.icon}
                            label={modulInfo.label}
                            color={modulInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.deskripsi}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.ip_address}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* View Activity Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detail Aktivitas
        </DialogTitle>
        <DialogContent>
          {selectedAktivitas && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                   fullWidth
                   label="Tanggal Aktivitas"
                   value={formatDate(selectedAktivitas.waktu_aktivitas)}
                   disabled
                 />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pengguna"
                  value={selectedAktivitas.pengguna?.nama}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                   fullWidth
                   label="Username"
                   value={selectedAktivitas.pengguna?.nama_pengguna}
                   disabled
                 />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Jenis Aktivitas"
                  value={getJenisAktivitasInfo(selectedAktivitas.jenis_aktivitas).label}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modul"
                  value={getModulInfo(selectedAktivitas.modul).label}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={selectedAktivitas.ip_address}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  multiline
                  rows={3}
                  value={selectedAktivitas.deskripsi}
                  disabled
                />
              </Grid>
              {selectedAktivitas.data_sebelum && (
                 <Grid item xs={12}>
                   <TextField
                     fullWidth
                     label="Data Sebelum"
                     multiline
                     rows={4}
                     value={JSON.stringify(selectedAktivitas.data_sebelum, null, 2)}
                     disabled
                   />
                 </Grid>
               )}
               {selectedAktivitas.data_sesudah && (
                 <Grid item xs={12}>
                   <TextField
                     fullWidth
                     label="Data Sesudah"
                     multiline
                     rows={4}
                     value={JSON.stringify(selectedAktivitas.data_sesudah, null, 2)}
                     disabled
                   />
                 </Grid>
               )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoriTransaksi;