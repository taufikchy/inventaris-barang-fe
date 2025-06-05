import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const Barang = () => {
  const navigate = useNavigate();
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

  // Fetch barang data
  const fetchBarangs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (filters.kategori) params.append('kategori', filters.kategori);
      if (filters.lokasi) params.append('lokasi', filters.lokasi);
      if (filters.status) params.append('status', filters.status);
      if (filters.kondisi) params.append('kondisi', filters.kondisi);
      
      // Fetch data from API
      const response = await axios.get(`/api/barang?${params.toString()}`);
      
      if (response.data.sukses) {
        setBarangs(response.data.data);
      } else {
        toast.error('Gagal memuat data barang: ' + response.data.pesan);
        setBarangs([]);
      }
      
      // Fetch kategori and lokasi data for dropdowns
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
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barangs:', error);
      toast.error('Gagal memuat data barang: ' + (error.response?.data?.pesan || error.message));
      setBarangs([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarangs();
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
      toast.error('Gagal menghapus barang: ' + (error.response?.data?.pesan || error.message));
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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
      case 'Rusak':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get kondisi chip color
  const getKondisiColor = (kondisi) => {
    switch (kondisi) {
      case 'Baik':
        return 'success';
      case 'Rusak Ringan':
        return 'warning';
      case 'Rusak Berat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Table columns definition
  const columns = [
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'nama', label: 'Nama Barang', sortable: true },
    {
      id: 'kategori',
      label: 'Kategori',
      sortable: true,
      format: (value) => value?.nama || value || '-',
    },
    {
      id: 'lokasi',
      label: 'Lokasi',
      sortable: true,
      format: (value) => value?.nama || value || '-',
    },
    {
      id: 'jumlah',
      label: 'Jumlah',
      sortable: true,
      align: 'right',
    },
    {
      id: 'kondisi',
      label: 'Kondisi',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={getKondisiColor(value)}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={getStatusColor(value)}
        />
      ),
    },
  ];

  // Table actions
  const actions = (row) => (
    <Box>
      <Tooltip title="Lihat Detail">
        <IconButton onClick={() => navigate(`/barang/${row.id}`)} size="small">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton onClick={() => navigate(`/barang/${row.id}`, { state: { edit: true } })} size="small">
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Hapus">
        <IconButton onClick={() => handleDeleteConfirm(row)} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Barang Inventaris"
        actionText="Tambah Barang"
        actionIcon={<AddIcon />}
        onActionClick={() => navigate('/barang/new')}
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
                <MenuItem value="Rusak">Rusak</MenuItem>
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