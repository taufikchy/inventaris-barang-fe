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
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Visibility as VisibilityIcon, FilterAlt as FilterAltIcon, FileDownload as FileDownloadIcon, TableView as TableViewIcon, Description as DescriptionIcon, KeyboardArrowDown as KeyboardArrowDownIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import AlertDialog from '../components/AlertDialog';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HistoriAktivitas = () => {
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
  
  // Alert dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');



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
      
      const response = await axios.get(`/api/histori-aktivitas?${params.toString()}`);
      
      if (response.data.success) {
        setHistoriAktivitas(response.data.data);
        setTotalRows(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching activity history:', error);
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
      case 'update': return 'info';
      case 'delete': return 'error';
      case 'login': return 'primary';
      case 'logout': return 'secondary';
      default: return 'default';
    }
  };

  const getModulLabel = (modulName) => {
    switch (modulName) {
      case 'barang': return 'Barang';
      case 'kategori': return 'Kategori';
      case 'lokasi': return 'Lokasi';
      case 'pengguna': return 'Pengguna';
      case 'peminjaman': return 'Peminjaman';
      case 'transaksi': return 'Transaksi';
      case 'auth': return 'Autentikasi';
      default: return modulName;
    }
  };

  const columns = [
    {
      id: 'waktu_aktivitas',
      label: 'Tanggal',
      minWidth: 120,
      format: (value) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.4 }}>
            {dayjs(value).locale('id').format('DD MMMM YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
            {dayjs(value).locale('id').format('HH:mm')}
          </Typography>
        </Box>
      )
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      minWidth: 120,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.4 }}>
          {value?.nama || 'Sistem'}
        </Typography>
      )
    },
    {
      id: 'role',
      label: 'Role',
      minWidth: 100,
      format: (value, row) => {
        const getRoleDisplayName = (role) => {
          switch (role) {
            case 'admin':
              return 'Administrator';
            case 'kepala_lab':
              return 'Kepala Lab';
            case 'staff':
              return 'Staff';
            case 'guru':
              return 'Guru';
            default:
              return 'Pengguna';
          }
        };
        return (
          <Typography variant="body2" sx={{ margin: 0, padding: 0, lineHeight: 1.4 }}>
            {row?.pengguna?.peran ? getRoleDisplayName(row.pengguna.peran) : 'Sistem'}
          </Typography>
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
          setAlertMessage('Silakan pilih tanggal mulai dan tanggal akhir terlebih dahulu untuk ekspor rentang tanggal custom.');
          setAlertOpen(true);
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
      
      const response = await axios.get(`/api/histori-aktivitas/ekspor?${params.toString()}`, {
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
        filename = `histori-aktivitas-${startDate}-to-${endDate}-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      } else {
        filename = `histori-aktivitas-${periode}-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      }
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setAlertMessage('Gagal mengekspor data. Silakan coba lagi.');
      setAlertOpen(true);
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
      
      // Helper function untuk mengkonversi value menjadi string yang bisa ditampilkan
      const formatValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') {
          // Handle kategori dan lokasi objects
          if (value.nama) return value.nama;
          if (value.id && value.nama) return value.nama;
          // Handle array of objects
          if (Array.isArray(value)) {
            return value.map(item => {
              if (typeof item === 'object' && item.nama) return item.nama;
              return String(item);
            }).join(', ');
          }
          return JSON.stringify(value);
        }
        
        // Format status peminjaman dengan kapitalisasi yang konsisten
        const statusMapping = {
          'menunggu_persetujuan': 'Menunggu Persetujuan',
          'disetujui': 'Disetujui',
          'ditolak': 'Ditolak',
          'dipinjam': 'Dipinjam',
          'dikembalikan': 'Dikembalikan',
          'terlambat': 'Terlambat'
        };
        
        const stringValue = String(value);
        return statusMapping[stringValue] || stringValue;
      };
      
      // Daftar field yang penting untuk ditampilkan
      const importantFields = {
        'nama': 'Nama',
        'nama_barang': 'Nama Barang',
        'nama_peminjam': 'Nama Peminjam',
        'kode': 'Kode',
        'jumlah': 'Jumlah',
        'status': 'Status',
        'kondisi': 'Kondisi',
        'nama_lokasi': 'Lokasi',
        'nama_kategori': 'Kategori',
        'id_kategori': 'ID Kategori',
        'id_lokasi': 'ID Lokasi',
        'deskripsi': 'Deskripsi',
        'tanggal_pinjam': 'Tanggal Pinjam',
        'tanggal_kembali_harapan': 'Tanggal Kembali Harapan',
        'kontak_peminjam': 'Kontak Peminjam',
        'kelas_peminjam': 'Kelas Peminjam',
        'catatan': 'Catatan'
      };
      
      // Bandingkan field yang penting
      Object.keys(importantFields).forEach(field => {
        const beforeValue = before[field];
        const afterValue = after[field];
        
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue) && (beforeValue !== undefined || afterValue !== undefined)) {
          changes.push({
            field: importantFields[field],
            before: formatValue(beforeValue),
            after: formatValue(afterValue)
          });
        }
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
        title="Histori Aktivitas" 
        subtitle="Daftar aktivitas pengguna dalam sistem"
      />
      
      {/* Filters */}
      <Card sx={{ mb: 3, display: showFilters ? 'block' : 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Aktivitas
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

                <MenuItem value="auth">Autentikasi</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Pengguna"
                value={rolePengguna}
                onChange={(e) => setRolePengguna(e.target.value)}
                size="small"
              >
                <MenuItem value="">Semua Role</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="kepala_lab">Kepala Lab</MenuItem>
                <MenuItem value="toolman">Toolman</MenuItem>
                <MenuItem value="sarana">Sarana</MenuItem>
              </TextField>
            </Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Tanggal Mulai"
                  value={tanggalMulai}
                  onChange={(newValue) => setTanggalMulai(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Tanggal Akhir"
                  value={tanggalAkhir}
                  onChange={(newValue) => setTanggalAkhir(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
            </LocalizationProvider>
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
          variant="outlined"
          startIcon={exportLoading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          endIcon={!exportLoading && <KeyboardArrowDownIcon />}
          onClick={handleExportClick}
          disabled={exportLoading}
        >
          {exportLoading ? 'Mengekspor...' : 'Ekspor Data'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArchiveIcon />}
          onClick={() => navigate('/histori-aktivitas/arsip')}
        >
          Arsip
        </Button>
        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        </Button>
      </Box>
      
      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={exportMenuOpen}
        onClose={handleExportClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleExport('excel', 'hari_ini')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Hari Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel', 'minggu_ini')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Minggu Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel', 'bulan_ini')}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Excel - Bulan Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel', 'semua')}>
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
        <Divider />
        <MenuItem onClick={() => handleExport('csv', 'hari_ini')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV - Hari Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'minggu_ini')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV - Minggu Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'bulan_ini')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV - Bulan Ini" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv', 'semua')}>
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
        title="Daftar Aktivitas"
        columns={columns}
        rows={historiAktivitas}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchHistoriAktivitas}
        searchable
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        emptyMessage="Belum ada data aktivitas"
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
          Detail Aktivitas
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tanggal & Waktu
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
                    {(() => {
                      const getRoleDisplayName = (role) => {
                        switch (role) {
                          case 'admin':
                            return 'Administrator';
                          case 'kepala_lab':
                            return 'Kepala Lab';
                          case 'staff':
                            return 'Staff';
                          case 'guru':
                            return 'Guru';
                          default:
                            return 'Pengguna';
                        }
                      };
                      return selectedActivity.pengguna?.peran ? getRoleDisplayName(selectedActivity.pengguna.peran) : 'Sistem';
                    })()} 
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
                      sx={{ color: 'white' }}
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
                {/* Kode untuk berbagai modul */}
                {(selectedActivity.modul === 'barang' || selectedActivity.modul === 'kategori' || selectedActivity.modul === 'lokasi' || selectedActivity.modul === 'peminjaman') && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {(() => {
                        switch(selectedActivity.modul) {
                          case 'barang': return 'Kode Barang';
                          case 'kategori': return 'Kode Kategori';
                          case 'lokasi': return 'Kode Lokasi';
                          case 'peminjaman': return 'Kode Peminjaman';
                          default: return 'Kode';
                        }
                      })()} 
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {(() => {
                        // Untuk peminjaman, prioritaskan nama_objek yang berisi kode_peminjaman
                        if (selectedActivity.modul === 'peminjaman') {
                          if (selectedActivity.nama_objek && selectedActivity.nama_objek.startsWith('PJM-')) {
                            return selectedActivity.nama_objek;
                          }
                          // Fallback ke data_sesudah atau data_sebelum
                          try {
                            const dataSesudah = selectedActivity.data_sesudah ? JSON.parse(selectedActivity.data_sesudah) : null;
                            const dataSebelum = selectedActivity.data_sebelum ? JSON.parse(selectedActivity.data_sebelum) : null;
                            return dataSesudah?.kode_peminjaman || dataSebelum?.kode_peminjaman || 'Tidak tersedia';
                          } catch (e) {
                            return 'Tidak tersedia';
                          }
                        }
                        
                        // Untuk modul barang, tampilkan hanya kode barang
                        if (selectedActivity.modul === 'barang') {
                          let kodeBarang = 'Tidak tersedia';
                          
                          // Coba ambil kode dari nama_objek
                          if (selectedActivity.nama_objek && selectedActivity.nama_objek.includes('-')) {
                            kodeBarang = selectedActivity.nama_objek;
                          } else {
                            // Coba ambil dari data_sesudah atau data_sebelum
                            try {
                              const dataSesudah = selectedActivity.data_sesudah ? JSON.parse(selectedActivity.data_sesudah) : null;
                              const dataSebelum = selectedActivity.data_sebelum ? JSON.parse(selectedActivity.data_sebelum) : null;
                              kodeBarang = dataSesudah?.kode || dataSebelum?.kode || 'Tidak tersedia';
                            } catch (e) {
                              // Ignore parsing error
                            }
                          }
                          
                          return kodeBarang;
                        }
                        
                        // Untuk modul lain, coba ambil kode dari nama_objek atau data
                        if (selectedActivity.nama_objek && selectedActivity.nama_objek.includes('-')) {
                          return selectedActivity.nama_objek;
                        }
                        
                        // Coba ambil dari data_sesudah
                        try {
                          const dataSesudah = selectedActivity.data_sesudah ? JSON.parse(selectedActivity.data_sesudah) : null;
                          if (dataSesudah && dataSesudah.kode) {
                            return dataSesudah.kode;
                          }
                        } catch (e) {
                          // Ignore parsing error
                        }
                        
                        // Coba ambil dari data_sebelum
                        try {
                          const dataSebelum = selectedActivity.data_sebelum ? JSON.parse(selectedActivity.data_sebelum) : null;
                          if (dataSebelum && dataSebelum.kode) {
                            return dataSebelum.kode;
                          }
                        } catch (e) {
                          // Ignore parsing error
                        }
                        
                        return 'Tidak tersedia';
                      })()} 
                    </Typography>
                  </Grid>
                )}
                
                {/* Nama Barang untuk modul barang */}
                {selectedActivity.modul === 'barang' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nama Barang
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {(() => {
                        try {
                          const dataSesudah = selectedActivity.data_sesudah ? JSON.parse(selectedActivity.data_sesudah) : null;
                          const dataSebelum = selectedActivity.data_sebelum ? JSON.parse(selectedActivity.data_sebelum) : null;
                          return dataSesudah?.nama || dataSebelum?.nama || 'Tidak tersedia';
                        } catch (e) {
                          return 'Tidak tersedia';
                        }
                      })()} 
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
                {(selectedActivity.data_sebelum || selectedActivity.data_sesudah) && (() => {
                  const changes = formatDataChanges(selectedActivity.data_sebelum, selectedActivity.data_sesudah);
                  
                  if (!changes || changes.length === 0) {
                    return (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Detail Perubahan
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Tidak ada perubahan data yang dapat ditampilkan
                        </Typography>
                      </Grid>
                    );
                  }
                  
                  return (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Detail Perubahan
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
      
      {/* Alert Dialog */}
      <AlertDialog
        open={alertOpen}
        title="Peringatan"
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
        severity="warning"
      />
    </Box>
  );
};

export default HistoriAktivitas;