import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
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
  const { isAdmin, isKepalaLab, isToolman, isAdminOrToolman } = useAuth();
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
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  // Fetch peminjaman data
  const fetchPeminjamans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/peminjaman', {
        params: {
          status: filters.status,
          tanggal_mulai: filters.tanggal_mulai ? filters.tanggal_mulai : undefined,
          tanggal_akhir: filters.tanggal_selesai ? filters.tanggal_selesai : undefined,
          halaman: page,
          batas: rowsPerPage
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Pastikan struktur data sesuai dengan respons dari backend
      if (response.data.sukses) {
        // Proses data untuk menambahkan properti peminjam dan jumlah_barang
        const processedData = response.data.data.map(peminjaman => {
          // Tambahkan properti peminjam dari nama_peminjam
          const peminjamData = {
            ...peminjaman,
            peminjam: peminjaman.nama_peminjam,
            // Hitung jumlah barang dari detail_peminjaman jika ada
            jumlah_barang: peminjaman.detail_peminjaman ? 
              peminjaman.detail_peminjaman.reduce((total, detail) => total + detail.jumlah, 0) : 
              0
          };
          return peminjamData;
        });
        
        setPeminjamans(processedData);
        setTotalRows(response.data.pagination.total);
      } else {
        console.error('Error fetching peminjamans:', response.data.pesan);
        setAlert({ show: true, message: response.data.pesan, severity: 'error' });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching peminjamans:', error);
      setAlert({ 
        show: true, 
        message: error.response?.data?.pesan || 'Gagal memuat data peminjaman', 
        severity: 'error' 
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeminjamans();
  }, [page, rowsPerPage, filters]);

  // Handle delete confirmation
  const handleDeleteConfirm = (peminjaman) => {
    setCurrentPeminjaman(peminjaman);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      // Send delete request to API
      const response = await axios.delete(`/api/peminjaman/${currentPeminjaman.id}`);
      
      if (response.data.sukses) {
        // Remove from state
        setPeminjamans(peminjamans.filter(p => p.id !== currentPeminjaman.id));
        toast.success('Peminjaman berhasil dihapus');
      } else {
        toast.error('Gagal menghapus peminjaman: ' + response.data.pesan);
      }
      
      setConfirmDelete(false);
      setCurrentPeminjaman(null);
    } catch (error) {
      console.error('Error deleting peminjaman:', error);
      toast.error('Gagal menghapus peminjaman: ' + (error.response?.data?.pesan || error.message));
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
      case 'menunggu_persetujuan':
        return 'warning';
      case 'disetujui':
        return 'primary';
      case 'ditolak':
        return 'error';
      case 'dipinjam':
        return 'info';
      case 'dikembalikan':
        return 'success';
      case 'terlambat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'menunggu_persetujuan':
        return 'Menunggu Persetujuan';
      case 'disetujui':
        return 'Disetujui';
      case 'ditolak':
        return 'Ditolak';
      case 'dipinjam':
        return 'Dipinjam';
      case 'dikembalikan':
        return 'Dikembalikan';
      case 'terlambat':
        return 'Terlambat';
      default:
        return status;
    }
  };

  // Table columns definition
  const columns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
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
          label={getStatusLabel(value)}
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
      
      {/* Edit button - only for Admin and Toolman, and only for peminjaman with status menunggu_persetujuan */}
      {isAdminOrToolman() && row.status === 'menunggu_persetujuan' && (
        <Tooltip title="Edit">
          <IconButton onClick={() => navigate(`/peminjaman/${row.id}/edit`)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Delete button - only for Kepala Lab */}
      {isKepalaLab() && (
        <Tooltip title="Hapus">
          <IconButton onClick={() => handleDeleteConfirm(row)} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Peminjaman Barang"
        actionText="Tambah Peminjaman"
        actionIcon={<AddIcon />}
        onActionClick={() => navigate('/peminjaman/new')}
        showAction={isAdminOrToolman()}
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
                <MenuItem value="menunggu_persetujuan">Menunggu Persetujuan</MenuItem>
                <MenuItem value="disetujui">Disetujui</MenuItem>
                <MenuItem value="ditolak">Ditolak</MenuItem>
                <MenuItem value="dipinjam">Dipinjam</MenuItem>
                <MenuItem value="dikembalikan">Dikembalikan</MenuItem>
                <MenuItem value="terlambat">Terlambat</MenuItem>
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
        page={page - 1} // Konversi page dari 1-based (API) ke 0-based (MUI)
        rowsPerPage={rowsPerPage}
        count={totalRows}
        onPageChange={(event, newPage) => setPage(newPage + 1)} // Konversi kembali dari 0-based ke 1-based
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(1); // Reset ke halaman pertama
        }}
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