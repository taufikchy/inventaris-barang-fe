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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

const Transaksi = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedTransaksi, setSelectedTransaksi] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  // Filters
  const [filters, setFilters] = useState({
    jenis_transaksi: '',
    tanggal_mulai: null,
    tanggal_akhir: null,
    id_barang: '',
    status: '',
    search: ''
  });
  
  // Form data
  const [formData, setFormData] = useState({
    id_barang: '',
    jenis_transaksi: '',
    jumlah: '',
    keterangan: '',
    harga_satuan: '',
    supplier: '',
    nomor_faktur: ''
  });
  
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  const jenisTransaksiOptions = [
    { value: 'masuk', label: 'Barang Masuk', color: 'success', icon: <TrendingUpIcon /> },
    { value: 'keluar', label: 'Barang Keluar', color: 'primary', icon: <TrendingDownIcon /> },
    { value: 'rusak', label: 'Barang Rusak', color: 'warning', icon: <WarningIcon /> },
    { value: 'hilang', label: 'Barang Hilang', color: 'error', icon: <ErrorIcon /> }
  ];
  
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'approved', label: 'Disetujui', color: 'success' },
    { value: 'rejected', label: 'Ditolak', color: 'error' }
  ];

  useEffect(() => {
    fetchTransaksi();
    fetchBarang();
  }, [page, filters]);

  const fetchTransaksi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit,
        ...filters,
        tanggal_mulai: filters.tanggal_mulai ? dayjs(filters.tanggal_mulai).format('YYYY-MM-DD') : '',
        tanggal_akhir: filters.tanggal_akhir ? dayjs(filters.tanggal_akhir).format('YYYY-MM-DD') : ''
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const response = await axios.get('/api/transaksi', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setTransaksi(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showAlert('Gagal mengambil data transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBarang = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/barang', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 } // Get all items for dropdown
      });
      setBarang(response.data.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleOpenDialog = (mode, transaksi = null) => {
    setDialogMode(mode);
    setSelectedTransaksi(transaksi);
    
    if (mode === 'add') {
      setFormData({
        id_barang: '',
        jenis_transaksi: '',
        jumlah: '',
        keterangan: '',
        harga_satuan: '',
        supplier: '',
        nomor_faktur: ''
      });
    } else if (mode === 'edit' && transaksi) {
      setFormData({
        id_barang: transaksi.id_barang,
        jenis_transaksi: transaksi.jenis_transaksi,
        jumlah: transaksi.jumlah,
        keterangan: transaksi.keterangan || '',
        harga_satuan: transaksi.harga_satuan || '',
        supplier: transaksi.supplier || '',
        nomor_faktur: transaksi.nomor_faktur || ''
      });
    }
    
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaksi(null);
    setFormData({
      id_barang: '',
      jenis_transaksi: '',
      jumlah: '',
      keterangan: '',
      harga_satuan: '',
      supplier: '',
      nomor_faktur: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.id_barang) newErrors.id_barang = 'Barang harus dipilih';
    if (!formData.jenis_transaksi) newErrors.jenis_transaksi = 'Jenis transaksi harus dipilih';
    if (!formData.jumlah || formData.jumlah <= 0) newErrors.jumlah = 'Jumlah harus lebih dari 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        jumlah: parseInt(formData.jumlah),
        harga_satuan: formData.harga_satuan ? parseFloat(formData.harga_satuan) : null
      };
      
      if (dialogMode === 'add') {
        await axios.post('/api/transaksi', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlert('Transaksi berhasil ditambahkan', 'success');
      }
      
      handleCloseDialog();
      fetchTransaksi();
    } catch (error) {
      console.error('Error saving transaction:', error);
      const message = error.response?.data?.message || 'Gagal menyimpan transaksi';
      showAlert(message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/transaksi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('Transaksi berhasil dihapus', 'success');
      fetchTransaksi();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const message = error.response?.data?.message || 'Gagal menghapus transaksi';
      showAlert(message, 'error');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      jenis_transaksi: '',
      tanggal_mulai: null,
      tanggal_akhir: null,
      id_barang: '',
      status: '',
      search: ''
    });
    setPage(1);
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  const getJenisTransaksiInfo = (jenis) => {
    return jenisTransaksiOptions.find(option => option.value === jenis) || 
           { label: jenis, color: 'default', icon: null };
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || 
           { label: status, color: 'default' };
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
          Manajemen Transaksi
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Tambah Transaksi
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
                  <InputLabel>Jenis Transaksi</InputLabel>
                  <Select
                    value={filters.jenis_transaksi}
                    label="Jenis Transaksi"
                    onChange={(e) => handleFilterChange('jenis_transaksi', e.target.value)}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    {jenisTransaksiOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    {statusOptions.map(option => (
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
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Tanggal Akhir"
                  value={filters.tanggal_akhir}
                  onChange={(value) => handleFilterChange('tanggal_akhir', value)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Barang</InputLabel>
                  <Select
                    value={filters.id_barang}
                    label="Barang"
                    onChange={(e) => handleFilterChange('id_barang', e.target.value)}
                  >
                    <MenuItem value="">Semua Barang</MenuItem>
                    {barang.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nama} ({item.kode})
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
                  placeholder="Cari nama barang atau keterangan"
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
              Daftar Transaksi ({totalItems} total)
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal</TableCell>
                  <TableCell>Barang</TableCell>
                  <TableCell>Jenis</TableCell>
                  <TableCell>Jumlah</TableCell>
                  <TableCell>Harga Satuan</TableCell>
                  <TableCell>Total Harga</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pengguna</TableCell>
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
                ) : transaksi.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data transaksi
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transaksi.map((item) => {
                    const jenisInfo = getJenisTransaksiInfo(item.jenis_transaksi);
                    const statusInfo = getStatusInfo(item.status);
                    
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{formatDate(item.tanggal_transaksi)}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.barang?.nama}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.barang?.kode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={jenisInfo.icon}
                            label={jenisInfo.label}
                            color={jenisInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.jumlah}</TableCell>
                        <TableCell>{formatCurrency(item.harga_satuan)}</TableCell>
                        <TableCell>{formatCurrency(item.total_harga)}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.pengguna?.nama}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('view', item)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item.id)}
                            >
                              <DeleteIcon />
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

      {/* Add/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Tambah Transaksi'}
          {dialogMode === 'edit' && 'Edit Transaksi'}
          {dialogMode === 'view' && 'Detail Transaksi'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_barang}>
                <InputLabel>Barang *</InputLabel>
                <Select
                  value={formData.id_barang}
                  label="Barang *"
                  onChange={(e) => setFormData(prev => ({ ...prev, id_barang: e.target.value }))}
                  disabled={dialogMode === 'view'}
                >
                  {barang.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nama} ({item.kode}) - Stok: {item.jumlah}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_barang && (
                  <Typography variant="caption" color="error">
                    {errors.id_barang}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.jenis_transaksi}>
                <InputLabel>Jenis Transaksi *</InputLabel>
                <Select
                  value={formData.jenis_transaksi}
                  label="Jenis Transaksi *"
                  onChange={(e) => setFormData(prev => ({ ...prev, jenis_transaksi: e.target.value }))}
                  disabled={dialogMode === 'view'}
                >
                  {jenisTransaksiOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.jenis_transaksi && (
                  <Typography variant="caption" color="error">
                    {errors.jenis_transaksi}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jumlah *"
                type="number"
                value={formData.jumlah}
                onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
                error={!!errors.jumlah}
                helperText={errors.jumlah}
                disabled={dialogMode === 'view'}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Harga Satuan"
                type="number"
                value={formData.harga_satuan}
                onChange={(e) => setFormData(prev => ({ ...prev, harga_satuan: e.target.value }))}
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nomor Faktur"
                value={formData.nomor_faktur}
                onChange={(e) => setFormData(prev => ({ ...prev, nomor_faktur: e.target.value }))}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Keterangan"
                multiline
                rows={3}
                value={formData.keterangan}
                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            {dialogMode === 'view' && selectedTransaksi && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Harga"
                    value={formatCurrency(selectedTransaksi.total_harga)}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Status"
                    value={getStatusInfo(selectedTransaksi.status).label}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tanggal Transaksi"
                    value={formatDate(selectedTransaksi.tanggal_transaksi)}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dibuat Oleh"
                    value={selectedTransaksi.pengguna?.nama}
                    disabled
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'add' ? 'Tambah' : 'Simpan'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transaksi;