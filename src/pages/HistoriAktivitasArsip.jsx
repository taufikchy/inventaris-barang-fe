import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Visibility as VisibilityIcon, FilterAlt as FilterAltIcon, Archive as ArchiveIcon, FileDownload as FileDownloadIcon, Description as DescriptionIcon, TableView as TableViewIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HistoriAktivitasArsip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historiAktivitas, setHistoriAktivitas] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [jenisAktivitas, setJenisAktivitas] = useState('');
  const [modul, setModul] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalAkhir, setTanggalAkhir] = useState(null);
  const [rolePengguna, setRolePengguna] = useState('');
  
  // Detail dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Export states
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const exportMenuOpen = Boolean(exportMenuAnchor);

  const fetchHistoriAktivitas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', rowsPerPage);
      
      if (searchTerm) params.append('search', searchTerm);
      if (jenisAktivitas) params.append('jenis_aktivitas', jenisAktivitas);
      if (modul) params.append('modul', modul);
      if (rolePengguna) params.append('role_pengguna', rolePengguna);
      
      if (tanggalMulai) {
        params.append('tanggal_mulai', dayjs(tanggalMulai).format('YYYY-MM-DD'));
      }
      
      if (tanggalAkhir) {
        params.append('tanggal_akhir', dayjs(tanggalAkhir).format('YYYY-MM-DD'));
      }
      
      const response = await axios.get(`/api/histori-aktivitas/archive/data?${params.toString()}`);
      
      if (response.data.success) {
        setHistoriAktivitas(response.data.data);
        setTotalRows(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching archived activity history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoriAktivitas();
  }, [page, rowsPerPage, searchTerm, jenisAktivitas, modul, tanggalMulai, tanggalAkhir, rolePengguna]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setJenisAktivitas('');
    setModul('');
    setTanggalMulai(null);
    setTanggalAkhir(null);
    setRolePengguna('');
    setPage(1);
  };

  const getJenisAktivitasLabel = (jenis) => {
    switch (jenis) {
      case 'create': return 'Tambah';
      case 'update': return 'Ubah';
      case 'delete': return 'Hapus';
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      default: return jenis;
    }
  };

  const getJenisAktivitasColor = (jenis) => {
    switch (jenis) {
      case 'create': return 'success';
      case 'update': return 'warning';
      case 'delete': return 'error';
      case 'login': return 'info';
      case 'logout': return 'default';
      default: return 'default';
    }
  };

  const getModulLabel = (modul) => {
    switch (modul) {
      case 'barang': return 'Barang';
      case 'kategori': return 'Kategori';
      case 'lokasi': return 'Lokasi';
      case 'pengguna': return 'Pengguna';
      case 'peminjaman': return 'Peminjaman';
      case 'transaksi': return 'Transaksi';
      case 'auth': return 'Autentikasi';
      default: return modul;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'kepala_lab': return 'Kepala Lab';
      case 'mahasiswa': return 'Mahasiswa';
      default: return role;
    }
  };

  const columns = [
    {
      id: 'waktu_aktivitas',
      label: 'Tanggal & Waktu',
      minWidth: 140,
      format: (value) => {
        const date = dayjs(value).locale('id');
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.2 }}>
              {date.format('DD MMM YYYY')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
              {date.format('HH:mm')}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'archived_at',
      label: 'Diarsipkan',
      minWidth: 140,
      format: (value) => {
        const date = dayjs(value).locale('id');
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.2 }}>
              {date.format('DD MMM YYYY')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
              {date.format('HH:mm')}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      minWidth: 120,
      format: (value, row) => {
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.2 }}>
              {row?.pengguna?.nama || 'Sistem'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
              {row?.pengguna?.peran ? getRoleDisplayName(row.pengguna.peran) : 'Sistem'}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'jenis_aktivitas',
      label: 'Jenis Aktivitas',
      minWidth: 110,
      align: 'center',
      format: (value) => (
        <Chip 
          label={getJenisAktivitasLabel(value)} 
          color={getJenisAktivitasColor(value)} 
          size="small" 
          variant="outlined"
          sx={{ minWidth: 70 }}
        />
      )
    },
    {
      id: 'modul',
      label: 'Modul',
      minWidth: 120,
      format: (value) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500, 
            margin: 0, 
            padding: 0, 
            lineHeight: 1.4,
            whiteSpace: 'nowrap'
          }}
        >
          {getModulLabel(value)}
        </Typography>
      )
    },
    {
      id: 'deskripsi',
      label: 'Deskripsi',
      minWidth: 200,
      format: (value) => (
        <Typography 
          variant="body2" 
          sx={{ 
            maxWidth: 250,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
            padding: 0,
            lineHeight: 1.4
          }}
          title={value || '-'}
        >
          {value || '-'}
        </Typography>
      )
    },
    {
      id: 'ip_address',
      label: 'IP Address',
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{ margin: 0, padding: 0, lineHeight: 1.4, fontFamily: 'monospace' }}>
          {value || '-'}
        </Typography>
      )
    }
  ];

  const handleViewDetail = (activity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedActivity(null);
  };

  // Export functions
  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = async (format, periode) => {
    setExportLoading(true);
    setExportMenuAnchor(null);
    
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      // Jika periode adalah 'custom', gunakan tanggal dari filter
      if (periode === 'custom') {
        if (tanggalMulai && tanggalAkhir) {
          params.append('periode', 'custom');
          params.append('tanggal_mulai', dayjs(tanggalMulai).format('YYYY-MM-DD'));
          params.append('tanggal_akhir', dayjs(tanggalAkhir).format('YYYY-MM-DD'));
        } else {
          alert('Silakan pilih tanggal mulai dan tanggal akhir terlebih dahulu untuk ekspor rentang tanggal custom.');
          setExportLoading(false);
          return;
        }
      } else {
        params.append('periode', periode);
        
        // Tambahkan tanggal filter jika ada (untuk periode non-custom)
        if (tanggalMulai) {
          params.append('tanggal_mulai', dayjs(tanggalMulai).format('YYYY-MM-DD'));
        }
        
        if (tanggalAkhir) {
          params.append('tanggal_akhir', dayjs(tanggalAkhir).format('YYYY-MM-DD'));
        }
      }
      
      // Tambahkan filter yang sedang aktif
      if (jenisAktivitas) params.append('jenis_aktivitas', jenisAktivitas);
      if (modul) params.append('modul', modul);
      if (rolePengguna) params.append('role_pengguna', rolePengguna);
      
      const response = await axios.get(`/api/histori-aktivitas/archive/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename;
      if (periode === 'custom') {
        const startDate = dayjs(tanggalMulai).format('YYYY-MM-DD');
        const endDate = dayjs(tanggalAkhir).format('YYYY-MM-DD');
        filename = `histori-aktivitas-arsip-${startDate}-to-${endDate}-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      } else {
        filename = `histori-aktivitas-arsip-${periode}-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      }
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function untuk menyederhanakan tampilan data perubahan
  const formatDataChanges = (dataBefore, dataAfter) => {
    if (!dataBefore && !dataAfter) return null;
    
    try {
      const before = dataBefore ? JSON.parse(dataBefore) : {};
      const after = dataAfter ? JSON.parse(dataAfter) : {};
      
      const changes = [];
      
      // Gabungkan semua key dari before dan after
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
      
      allKeys.forEach(key => {
        const beforeValue = before[key];
        const afterValue = after[key];
        
        // Skip jika nilai sama
        if (beforeValue === afterValue) return;
        
        // Skip field yang tidak perlu ditampilkan
        if (['created_at', 'updated_at', 'id'].includes(key)) return;
        
        changes.push({
          field: key,
          before: beforeValue !== undefined ? String(beforeValue) : 'Tidak ada',
          after: afterValue !== undefined ? String(afterValue) : 'Dihapus'
        });
      });
      
      return changes;
    } catch (error) {
      console.error('Error parsing data changes:', error);
      return null;
    }
  };

  const actions = (row) => {
    return (
      <Tooltip title="Lihat Detail">
        <IconButton
          size="small"
          onClick={() => handleViewDetail(row)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box>
      <PageHeader 
        title="Histori Aktivitas Arsip" 
        subtitle="Daftar aktivitas pengguna yang telah diarsipkan"
        icon={<ArchiveIcon />}
        breadcrumbs={[
          { text: 'Histori Aktivitas', link: '/histori-aktivitas' },
          { text: 'Arsip' }
        ]}
        backButton={true}
        onBackClick={() => navigate('/histori-aktivitas')}
      />
      
      {/* Filters */}
      <Card sx={{ mb: 3, display: showFilters ? 'block' : 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Aktivitas Arsip
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Jenis Aktivitas"
                value={jenisAktivitas}
                onChange={(e) => setJenisAktivitas(e.target.value)}
                size="small"
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="create">Tambah</MenuItem>
                <MenuItem value="update">Ubah</MenuItem>
                <MenuItem value="delete">Hapus</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="logout">Logout</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Modul"
                value={modul}
                onChange={(e) => setModul(e.target.value)}
                size="small"
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="barang">Barang</MenuItem>
                <MenuItem value="kategori">Kategori</MenuItem>
                <MenuItem value="lokasi">Lokasi</MenuItem>
                <MenuItem value="pengguna">Pengguna</MenuItem>
                <MenuItem value="peminjaman">Peminjaman</MenuItem>
                <MenuItem value="transaksi">Transaksi</MenuItem>
                <MenuItem value="auth">Autentikasi</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Role Pengguna"
                value={rolePengguna}
                onChange={(e) => setRolePengguna(e.target.value)}
                size="small"
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="kepala_lab">Kepala Lab</MenuItem>
                <MenuItem value="mahasiswa">Mahasiswa</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
                <DatePicker
                  label="Tanggal Mulai"
                  value={tanggalMulai}
                  onChange={(newValue) => setTanggalMulai(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
                <DatePicker
                  label="Tanggal Akhir"
                  value={tanggalAkhir}
                  onChange={(newValue) => setTanggalAkhir(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
                sx={{ height: '40px' }}
              >
                Reset Filter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={exportLoading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleExportClick}
          disabled={exportLoading}
        >
          {exportLoading ? 'Mengekspor...' : 'Ekspor Data'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
        </Button>
      </Box>
      
      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={exportMenuOpen}
        onClose={handleExportClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => handleExport('excel', 'hari-ini')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Hari Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'hari-ini')}>
           <ListItemIcon>
             <DescriptionIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="CSV - Hari Ini" />
         </MenuItem>
         <Divider />
         <MenuItem onClick={() => handleExport('excel', 'minggu-ini')}>
           <ListItemIcon>
             <TableViewIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="Excel - Minggu Ini" />
         </MenuItem>
         <MenuItem onClick={() => handleExport('csv', 'minggu-ini')}>
           <ListItemIcon>
             <DescriptionIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="CSV - Minggu Ini" />
         </MenuItem>
         <Divider />
         <MenuItem onClick={() => handleExport('excel', 'bulan-ini')}>
           <ListItemIcon>
             <TableViewIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="Excel - Bulan Ini" />
         </MenuItem>
         <MenuItem onClick={() => handleExport('csv', 'bulan-ini')}>
           <ListItemIcon>
             <DescriptionIcon fontSize="small" />
           </ListItemIcon>
           <ListItemText primary="CSV - Bulan Ini" />
         </MenuItem>
         <Divider />
         <MenuItem onClick={() => handleExport('excel', 'semua-data')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Semua Data" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel', 'custom')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Rentang Tanggal Custom" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'semua-data')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV - Semua Data" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'custom')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV - Rentang Tanggal Custom" />
        </MenuItem>
      </Menu>
      
      <DataTable
        title="Daftar Aktivitas Arsip"
        columns={columns}
        rows={historiAktivitas}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchHistoriAktivitas}
        searchable
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        emptyMessage="Belum ada data aktivitas arsip"
        page={page - 1} // Konversi page dari 1-based (API) ke 0-based (MUI)
        rowsPerPage={rowsPerPage}
        count={totalRows}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      
      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detail Aktivitas Arsip
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tanggal & Waktu Aktivitas
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      {dayjs(selectedActivity.waktu_aktivitas).locale('id').format('DD MMMM YYYY')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {dayjs(selectedActivity.waktu_aktivitas).locale('id').format('HH:mm')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tanggal Diarsipkan
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      {dayjs(selectedActivity.archived_at).locale('id').format('DD MMMM YYYY')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {dayjs(selectedActivity.archived_at).locale('id').format('HH:mm')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pengguna
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.pengguna?.nama || 'Sistem'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.pengguna?.peran ? getRoleDisplayName(selectedActivity.pengguna.peran) : 'Sistem'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Jenis Aktivitas
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={getJenisAktivitasLabel(selectedActivity.jenis_aktivitas)} 
                      color={getJenisAktivitasColor(selectedActivity.jenis_aktivitas)} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Modul
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {getModulLabel(selectedActivity.modul)}
                  </Typography>
                </Grid>
                {selectedActivity.nama_objek && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Objek
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedActivity.nama_objek}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Deskripsi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.deskripsi}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedActivity.ip_address || 'Tidak tersedia'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {selectedActivity.user_agent || 'Tidak tersedia'}
                  </Typography>
                </Grid>
                
                {/* Data Perubahan */}
                {(() => {
                  const changes = formatDataChanges(selectedActivity.data_sebelum, selectedActivity.data_sesudah);
                  if (!changes || changes.length === 0) return null;
                  
                  return (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Data Perubahan
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Field</strong></TableCell>
                              <TableCell><strong>Sebelum</strong></TableCell>
                              <TableCell><strong>Sesudah</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {changes.map((change, index) => (
                              <TableRow key={index}>
                                <TableCell>{change.field}</TableCell>
                                <TableCell sx={{ color: 'error.main' }}>{change.before}</TableCell>
                                <TableCell sx={{ color: 'success.main' }}>{change.after}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  );
                })()}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoriAktivitasArsip;