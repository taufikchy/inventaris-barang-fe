import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

const Peminjaman = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [peminjamans, setPeminjamans] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentPeminjaman, setCurrentPeminjaman] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch peminjaman data
  const fetchPeminjamans = async () => {
    try {
      setLoading(true);
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData = [
        {
          id: 1,
          kode: 'PJM-001',
          peminjam: 'Budi Santoso',
          tanggal_pinjam: '2023-05-10',
          tanggal_kembali: '2023-05-15',
          status: 'Dikembalikan',
          keterangan: 'Peminjaman untuk praktikum jaringan',
          jumlah_barang: 3,
        },
        {
          id: 2,
          kode: 'PJM-002',
          peminjam: 'Ani Wijaya',
          tanggal_pinjam: '2023-06-20',
          tanggal_kembali: '2023-06-25',
          status: 'Dikembalikan',
          keterangan: 'Peminjaman untuk workshop robotika',
          jumlah_barang: 2,
        },
        {
          id: 3,
          kode: 'PJM-003',
          peminjam: 'Citra Dewi',
          tanggal_pinjam: '2023-07-05',
          tanggal_kembali: null,
          status: 'Dipinjam',
          keterangan: 'Peminjaman untuk penelitian',
          jumlah_barang: 1,
        },
        {
          id: 4,
          kode: 'PJM-004',
          peminjam: 'Deni Hermawan',
          tanggal_pinjam: '2023-07-10',
          tanggal_kembali: null,
          status: 'Dipinjam',
          keterangan: 'Peminjaman untuk kegiatan OSIS',
          jumlah_barang: 5,
        },
        {
          id: 5,
          kode: 'PJM-005',
          peminjam: 'Eka Putri',
          tanggal_pinjam: '2023-07-15',
          tanggal_kembali: '2023-07-20',
          status: 'Terlambat',
          keterangan: 'Peminjaman untuk lomba programming',
          jumlah_barang: 2,
        },
      ];
      
      setPeminjamans(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching peminjamans:', error);
      toast.error('Gagal memuat data peminjaman');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeminjamans();
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = (peminjaman) => {
    setCurrentPeminjaman(peminjaman);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      // In a real application, you would send this request to your API
      console.log('Deleting peminjaman:', currentPeminjaman);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from state
      setPeminjamans(peminjamans.filter(p => p.id !== currentPeminjaman.id));
      toast.success('Peminjaman berhasil dihapus');
      
      setConfirmDelete(false);
      setCurrentPeminjaman(null);
    } catch (error) {
      console.error('Error deleting peminjaman:', error);
      toast.error('Gagal menghapus peminjaman');
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

  // Apply filters to peminjaman data
  const filteredPeminjamans = peminjamans.filter((peminjaman) => {
    const matchesStatus = filters.status === '' || peminjaman.status === filters.status;
    
    let matchesDateRange = true;
    if (filters.tanggal_mulai && filters.tanggal_selesai) {
      const peminjamanDate = new Date(peminjaman.tanggal_pinjam);
      const startDate = new Date(filters.tanggal_mulai);
      const endDate = new Date(filters.tanggal_selesai);
      
      // Set time to midnight for accurate date comparison
      peminjamanDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      matchesDateRange = peminjamanDate >= startDate && peminjamanDate <= endDate;
    }
    
    return matchesStatus && matchesDateRange;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Dipinjam':
        return 'primary';
      case 'Dikembalikan':
        return 'success';
      case 'Terlambat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Table columns definition
  const columns = [
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'peminjam', label: 'Peminjam', sortable: true },
    {
      id: 'tanggal_pinjam',
      label: 'Tanggal Pinjam',
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      id: 'tanggal_kembali',
      label: 'Tanggal Kembali',
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      id: 'jumlah_barang',
      label: 'Jumlah Barang',
      sortable: true,
      align: 'right',
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
        <IconButton onClick={() => navigate(`/peminjaman/${row.id}`)} size="small">
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton onClick={() => navigate(`/peminjaman/${row.id}/edit`)} size="small">
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
        title="Peminjaman Barang"
        actionText="Tambah Peminjaman"
        actionIcon={<AddIcon />}
        onActionClick={() => navigate('/peminjaman/new')}
      />

      {/* Filters */}
      <Card sx={{ mb: 3, display: showFilters ? 'block' : 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Peminjaman
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
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
                <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                <MenuItem value="Dikembalikan">Dikembalikan</MenuItem>
                <MenuItem value="Terlambat">Terlambat</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Tanggal Mulai"
                name="tanggal_mulai"
                type="date"
                value={filters.tanggal_mulai}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Tanggal Selesai"
                name="tanggal_selesai"
                type="date"
                value={filters.tanggal_selesai}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
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
        title="Daftar Peminjaman"
        columns={columns}
        rows={filteredPeminjamans}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchPeminjamans}
        searchable
        emptyMessage="Belum ada data peminjaman"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Peminjaman"
        message={`Apakah Anda yakin ingin menghapus peminjaman dengan kode "${currentPeminjaman?.kode}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    </>
  );
};

export default Peminjaman;