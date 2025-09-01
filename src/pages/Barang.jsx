import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterAlt as FilterAltIcon,
  Visibility as VisibilityIcon,
  List as ListIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const Barang = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canCRUD, canDeleteBarang } = useAuth();
  const [loading, setLoading] = useState(true);
  const [barangs, setBarangs] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [lokasis, setLokasis] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentBarang, setCurrentBarang] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    kategori: '',
    lokasi: '',
    status: '',
    kondisi: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch dropdown data (kategori and lokasi)
  const fetchDropdownData = async () => {
    try {
      // Fetch kategori data for dropdowns
      const kategoriResponse = await axios.get('/api/kategori/dropdown');
      if (kategoriResponse.data.sukses) {
        setKategoris(kategoriResponse.data.data);
      } else {
        toast.error('Gagal memuat data kategori: ' + kategoriResponse.data.pesan);
        setKategoris([]);
      }
      
      // Fetch lokasi data
      const lokasiResponse = await axios.get('/api/lokasi/dropdown');
      if (lokasiResponse.data.sukses) {
        setLokasis(lokasiResponse.data.data);
      } else {
        toast.error('Gagal memuat data lokasi: ' + lokasiResponse.data.pesan);
        setLokasis([]);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Gagal memuat data dropdown: ' + (error.response?.data?.pesan || error.message));
    }
  };

  // Fetch barang data
  const fetchBarangs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const apiFilters = getApiFilters();
      const params = new URLSearchParams();
      if (apiFilters.kategori) params.append('kategori', apiFilters.kategori);
      if (apiFilters.lokasi) params.append('lokasi', apiFilters.lokasi);
      if (apiFilters.status) params.append('status', apiFilters.status);
      if (apiFilters.kondisi) params.append('kondisi', apiFilters.kondisi);
      
      // Tambahkan parameter batas untuk menampilkan lebih banyak data
      params.append('batas', 100);
      
      // Fetch data from API
      const response = await axios.get(`/api/barang?${params.toString()}`);
      
      if (response.data.sukses) {
        // Tambahkan satuan default jika tidak ada
        const barangsWithSatuan = response.data.data.map(barang => ({
          ...barang,
          satuan: barang.satuan || 'unit' // Default satuan jika tidak ada dari backend
        }));
        setBarangs(barangsWithSatuan);
      } else {
        toast.error('Gagal memuat data barang: ' + response.data.pesan);
        setBarangs([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barangs:', error);
      toast.error('Gagal memuat data barang: ' + (error.response?.data?.pesan || error.message));
      setBarangs([]);
      setLoading(false);
    }
  };

  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Read URL parameters and set filters when lokasis data is available
  useEffect(() => {
    if (lokasis.length === 0 || isInitialized) return; // Wait for lokasis data to be loaded and prevent re-initialization
    
    const kategori = searchParams.get('kategori') || '';
    const lokasiParam = searchParams.get('lokasi') || '';
    const status = searchParams.get('status') || '';
    const kondisi = searchParams.get('kondisi') || '';
    
    // If lokasi parameter is a name (from dashboard), find the corresponding ID
    let lokasiValue = lokasiParam;
    if (lokasiParam) {
      const foundLokasi = lokasis.find(lok => lok.nama === lokasiParam);
      if (foundLokasi) {
        lokasiValue = foundLokasi.id.toString();
      }
    }
    
    // Map kondisi from backend value to display value for dropdown
    let kondisiValue = kondisi;
    if (kondisi) {
      if (kondisi === 'baik') kondisiValue = 'Baik';
      else if (kondisi === 'rusak_ringan') kondisiValue = 'Rusak Ringan';
      else if (kondisi === 'rusak_berat') kondisiValue = 'Rusak Berat';
    }
    
    setFilters({
      kategori,
      lokasi: lokasiValue,
      status,
      kondisi: kondisiValue
    });
    
    setIsInitialized(true);
  }, [searchParams, lokasis, isInitialized]);

  // Fetch barangs when filters change
  useEffect(() => {
    fetchBarangs();
  }, [filters]);

  // Listen for inventory updates from other components
  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      console.log('Inventory updated, refreshing barang data...', event.detail);
      fetchBarangs();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = (barang) => {
    setCurrentBarang(barang);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`/api/barang/${currentBarang.id}`);
      
      if (response.data.sukses) {
        toast.success('Barang berhasil dihapus');
        fetchBarangs(); // Refresh data
      } else {
        toast.error('Gagal menghapus barang: ' + response.data.pesan);
      }
      
      setConfirmDelete(false);
      setCurrentBarang(null);
    } catch (error) {
      console.error('Error deleting barang:', error);
      
      let errorMessage = 'Gagal menghapus barang';
      
      if (error.response) {
        const status = error.response.status;
        const responseMessage = error.response.data?.pesan || error.response.data?.message;
        
        switch (status) {
          case 400:
            errorMessage = 'Barang tidak dapat dihapus. Kemungkinan barang memiliki riwayat peminjaman atau sedang dipinjam.';
            break;
          case 403:
            errorMessage = 'Anda tidak memiliki izin untuk menghapus barang. Hanya Kepala Lab yang dapat menghapus barang.';
            break;
          case 404:
            errorMessage = 'Barang tidak ditemukan.';
            break;
          default:
            errorMessage = responseMessage || `Terjadi kesalahan (${status})`;
        }
      } else {
        errorMessage = error.message || 'Terjadi kesalahan jaringan';
      }
      
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Convert filter values for API call
  const getApiFilters = () => {
    const apiFilters = { ...filters };
    
    // Convert kondisi display value to backend value
    if (apiFilters.kondisi) {
      if (apiFilters.kondisi === 'Baik') apiFilters.kondisi = 'baik';
      else if (apiFilters.kondisi === 'Rusak Ringan') apiFilters.kondisi = 'rusak_ringan';
      else if (apiFilters.kondisi === 'Rusak Berat') apiFilters.kondisi = 'rusak_berat';
    }
    
    return apiFilters;
  };

  // Apply filters to barang data
  const filteredBarangs = barangs.filter((barang) => {
    return (
      (filters.kategori === '' || barang.id_kategori === parseInt(filters.kategori)) &&
      (filters.lokasi === '' || barang.id_lokasi === parseInt(filters.lokasi)) &&
      (filters.status === '' || barang.status === filters.status) &&
      (filters.kondisi === '' || barang.kondisi === filters.kondisi)
    );
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Tersedia':
        return 'success';
      case 'Dipinjam':
        return 'primary';
      case 'Perbaikan':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get kondisi chip color
  const getKondisiColor = (kondisi) => {
    // Normalize kondisi to handle both database format and display format
    const normalizedKondisi = kondisi?.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedKondisi) {
      case 'baik':
        return 'success';
      case 'rusak_ringan':
        return 'warning';
      case 'rusak_berat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format kondisi label for display
  const formatKondisiLabel = (kondisi) => {
    if (!kondisi) return 'Baik';
    const normalizedKondisi = kondisi.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedKondisi) {
      case 'baik':
        return 'Baik';
      case 'rusak_ringan':
        return 'Rusak Ringan';
      case 'rusak_berat':
        return 'Rusak Berat';
      default:
        return kondisi;
    }
  };

  // Table columns definition
  const columns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      align: 'center',
      format: (value, row, displayIndex) => (
        <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'center' }}>
          {displayIndex + 1}
        </Typography>
      )
    },
    { 
      id: 'kode_grup', 
      label: 'Kode Grup', 
      sortable: true,
      align: 'center',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {value || '-'}
        </Typography>
      )
    },
    { 
      id: 'nama', 
      label: 'Nama Barang', 
      sortable: true,
      align: 'left',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 200, wordWrap: 'break-word' }}>
          {value || '-'}
        </Typography>
      )
    },
    {
      id: 'kategori',
      label: 'Kategori',
      sortable: true,
      align: 'center',
      format: (value) => (
        <Chip 
          label={value?.nama || value || '-'} 
          size="small" 
          variant="outlined"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            borderWidth: 1.5,
            '& .MuiChip-label': {
              px: 1.5,
              py: 0.5
            }
          }}
        />
      )
    },
    {
      id: 'tahun_pengadaan',
      label: 'Tahun Pengadaan',
      sortable: true,
      align: 'center',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value || '-'}
        </Typography>
      )
    },
    {
      id: 'tanggal_perolehan',
      label: 'Tanggal Pencatatan',
      sortable: true,
      align: 'center',
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value ? formatDate(value) : '-'}
        </Typography>
      )
    },
    {
      id: 'jumlah',
      label: 'Jumlah',
      sortable: true,
      align: 'center',
      format: (value, row) => {
        const jumlahText = `${value} ${row.satuan || 'unit'}`;
        // Tambahkan indikator untuk kategori bahan
        if (row.kategori?.tipe === 'bahan') {
          return (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {jumlahText}
              </Typography>
              <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                (Bahan - dapat digunakan sebagian)
              </Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {jumlahText}
          </Typography>
        );
      }
    },
    {
      id: 'stok',
      label: 'Stok Tersisa',
      sortable: true,
      align: 'center',
      format: (value, row) => {
        // Hanya tampilkan untuk kategori bahan
        if (row.kategori?.tipe === 'bahan') {
          const stok = row.stok || 0;
          const jumlahAwal = row.jumlah || 0;
          const persentaseStok = jumlahAwal > 0 ? (stok / jumlahAwal) * 100 : 0;
          
          // Tentukan warna berdasarkan persentase stok
          let chipColor = 'success';
          let chipLabel = 'Stok Aman';
          
          if (persentaseStok <= 10) {
            chipColor = 'error';
            chipLabel = 'Stok Kritis';
          } else if (persentaseStok <= 25) {
            chipColor = 'warning';
            chipLabel = 'Stok Menipis';
          } else if (persentaseStok <= 50) {
            chipColor = 'info';
            chipLabel = 'Stok Sedang';
          }
          
          // Untuk kategori bahan dengan satuan set, tampilkan unit tersisa
          if (row.satuan === 'set' && row.unit_per_set) {
            const unitTersisaDalamSet = row.unit_tersisa || 0;
            const totalUnit = jumlahAwal * row.unit_per_set;
            
            // Format tampilan: "0 set + 5 unit" atau "1 set" jika tidak ada sisa unit
            let displayText;
            if (unitTersisaDalamSet > 0) {
              displayText = `${stok} set + ${unitTersisaDalamSet} unit`;
            } else {
              displayText = `${stok} set`;
            }
            
            return (
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  {displayText}
                </Typography>
                <Chip
                  label={chipLabel}
                  color={chipColor}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    minWidth: '90px',
                    '& .MuiChip-label': { 
                      color: 'white',
                      px: 1.5,
                      py: 0.5
                    }
                  }}
                />
              </Box>
            );
          }
          
          return (
            <Box sx={{ textAlign: 'center', minWidth: 120 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {stok} {row.satuan || 'unit'}
              </Typography>
              <Chip
                label={chipLabel}
                color={chipColor}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  minWidth: '90px',
                  mb: 0.5,
                  '& .MuiChip-label': { 
                    color: 'white',
                    px: 1.5,
                    py: 0.5
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                {persentaseStok.toFixed(1)}% dari total
              </Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            -
          </Typography>
        );
      }
    },
  ];

  // State untuk dialog detail unit
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [unitFilters, setUnitFilters] = useState({
    kondisi: '',
    status: '',
    search: ''
  });

  // Handle buka dialog detail unit
  const handleOpenUnitDialog = (barang) => {
    setSelectedBarang(barang);
    setUnitDialogOpen(true);
  };

  // Handle tutup dialog detail unit
  const handleCloseUnitDialog = () => {
    setUnitDialogOpen(false);
    setSelectedBarang(null);
    setUnitFilters({
      kondisi: '',
      status: '',
      search: ''
    });
  };

  // Handle filter change untuk unit dialog
  const handleUnitFilterChange = (event) => {
    const { name, value } = event.target;
    setUnitFilters({
      ...unitFilters,
      [name]: value,
    });
  };

  // Filter units berdasarkan filter yang dipilih
  const getFilteredUnits = () => {
    if (!selectedBarang?.units) return [];
    
    return selectedBarang.units.filter((unit) => {
      const matchesKondisi = unitFilters.kondisi === '' || unit.kondisi === unitFilters.kondisi;
      const matchesStatus = unitFilters.status === '' || unit.status === unitFilters.status;
      const matchesSearch = unitFilters.search === '' || 
        unit.kode.toLowerCase().includes(unitFilters.search.toLowerCase());
      
      return matchesKondisi && matchesStatus && matchesSearch;
    });
  };

  // Table actions
  const actions = (row) => (
    <Box>
      <Tooltip title="Daftar Unit Barang">
        <IconButton onClick={() => {
          // Tampilkan dialog unit untuk melihat semua unit dalam grup
          setSelectedBarang(row);
          setUnitDialogOpen(true);
        }} size="small" color="primary">
          <ListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Barang Inventaris"
        actionText={canCRUD() ? "Tambah Barang" : undefined}
        actionIcon={canCRUD() ? <AddIcon /> : undefined}
        onActionClick={canCRUD() ? () => navigate('/barang/new') : undefined}
      />

      {/* Filters */}
      <Card sx={{ mb: 3, display: showFilters ? 'block' : 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Barang
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Kategori"
                name="kategori"
                value={filters.kategori}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">Semua Kategori</MenuItem>
                {kategoris.map((kategori) => (
                  <MenuItem key={kategori.id} value={kategori.id}>
                    {kategori.nama}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Lokasi"
                name="lokasi"
                value={filters.lokasi}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">Semua Lokasi</MenuItem>
                {lokasis.map((lokasi) => (
                  <MenuItem key={lokasi.id} value={lokasi.id}>
                    {lokasi.nama}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="Tersedia">Tersedia</MenuItem>
                <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                <MenuItem value="Perbaikan">Perbaikan</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Kondisi"
                name="kondisi"
                value={filters.kondisi}
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="">Semua Kondisi</MenuItem>
                <MenuItem value="Baik">Baik</MenuItem>
                <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
        </Button>
      </Box>

      <DataTable
        title="Daftar Barang"
        columns={columns}
        rows={filteredBarangs}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchBarangs}
        searchable
        emptyMessage="Belum ada data barang"
      />

      {/* Dialog Detail Unit */}
      <Dialog
        open={unitDialogOpen}
        onClose={handleCloseUnitDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detail Unit Barang: {selectedBarang?.nama} ({selectedBarang?.kode_grup})
        </DialogTitle>
        <DialogContent>
          {selectedBarang && (
            <>
              {/* Filter dan Pencarian untuk Unit */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filter & Pencarian Unit
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Pencarian Kode Unit"
                      name="search"
                      value={unitFilters.search}
                      onChange={handleUnitFilterChange}
                      size="small"
                      placeholder="Cari berdasarkan kode unit..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Kondisi"
                      name="kondisi"
                      value={unitFilters.kondisi}
                      onChange={handleUnitFilterChange}
                      size="small"
                    >
                      <MenuItem value="">Semua Kondisi</MenuItem>
                      <MenuItem value="Baik">Baik</MenuItem>
                      <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                      <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      name="status"
                      value={unitFilters.status}
                      onChange={handleUnitFilterChange}
                      size="small"
                    >
                      <MenuItem value="">Semua Status</MenuItem>
                      <MenuItem value="Tersedia">Tersedia</MenuItem>
                      <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                      <MenuItem value="Perbaikan">Perbaikan</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kode Unit</TableCell>
                      <TableCell>Kondisi</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Lokasi</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredUnits().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            {selectedBarang.units?.length === 0 ? 'Tidak ada unit untuk barang ini' : 'Tidak ada unit yang sesuai dengan filter'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredUnits().map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.kode}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatKondisiLabel(unit.kondisi)}
                          size="small"
                          color={getKondisiColor(unit.kondisi)}
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: '80px',
                            '& .MuiChip-label': {
                              px: 1.5,
                              py: 0.5
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={unit.status}
                          size="small"
                          color={getStatusColor(unit.status)}
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: '80px',
                            '& .MuiChip-label': {
                              px: 1.5,
                              py: 0.5
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{unit.lokasi ? (typeof unit.lokasi === 'object' ? unit.lokasi.nama : unit.lokasi) : '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Lihat Detail">
                            <IconButton onClick={() => {
                              handleCloseUnitDialog();
                              navigate(`/barang/${unit.id}`);
                            }} size="small" sx={{ mr: 1 }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canCRUD && (
                            <Tooltip title="Edit Barang">
                              <IconButton onClick={() => {
                                handleCloseUnitDialog();
                                navigate(`/barang/${unit.id}`, { state: { edit: true } });
                              }} size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnitDialog}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Barang"
        message={`Apakah Anda yakin ingin menghapus barang "${currentBarang?.nama}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    </>
  );
};

export default Barang;