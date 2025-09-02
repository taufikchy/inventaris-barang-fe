import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip, TextField, MenuItem, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Visibility as VisibilityIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const HistoriTransaksi = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaksi, setTransaksi] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [jenisTransaksi, setJenisTransaksi] = useState('');
  const [statusTransaksi, setStatusTransaksi] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(null);
  const [tanggalAkhir, setTanggalAkhir] = useState(null);
  const [idPengguna, setIdPengguna] = useState('');
  const [pengguna, setPengguna] = useState([]);

  const fetchPengguna = async () => {
    try {
      const response = await axios.get('/api/pengguna');
      if (response.data.success) {
        setPengguna(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTransaksi = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', rowsPerPage);
      
      if (searchTerm) params.append('search', searchTerm);
      if (jenisTransaksi) params.append('jenis_transaksi', jenisTransaksi);
      if (statusTransaksi) params.append('status', statusTransaksi);
      if (tanggalMulai) params.append('tanggal_mulai', dayjs(tanggalMulai).format('YYYY-MM-DD'));
      if (tanggalAkhir) params.append('tanggal_akhir', dayjs(tanggalAkhir).format('YYYY-MM-DD'));
      if (idPengguna) params.append('id_pengguna', idPengguna);

      const response = await axios.get(`/api/peminjaman?${params.toString()}`);
      if (response.data.success) {
        setTransaksi(response.data.data);
        setTotalRows(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transaksi:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengguna();
  }, []);

  useEffect(() => {
    fetchTransaksi();
  }, [page, rowsPerPage, searchTerm, jenisTransaksi, statusTransaksi, tanggalMulai, tanggalAkhir, idPengguna]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setJenisTransaksi('');
    setStatusTransaksi('');
    setTanggalMulai(null);
    setTanggalAkhir(null);
    setIdPengguna('');
    setPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'disetujui':
        return 'success';
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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Persetujuan';
      case 'disetujui':
        return 'Disetujui';
      case 'ditolak':
        return 'Ditolak';
      case 'dipinjam':
        return 'Sedang Dipinjam';
      case 'dikembalikan':
        return 'Dikembalikan';
      case 'terlambat':
        return 'Terlambat';
      default:
        return status;
    }
  };

  const columns = [
    {
      field: 'kode_peminjaman',
      headerName: 'Kode Transaksi',
      width: 150,
      sortable: true,
    },
    {
      field: 'nama_peminjam',
      headerName: 'Peminjam',
      width: 200,
      sortable: true,
    },
    {
      field: 'tanggal_peminjaman',
      headerName: 'Tanggal Peminjaman',
      width: 150,
      sortable: true,
      renderCell: (params) => {
        return dayjs(params.value).format('DD/MM/YYYY');
      },
    },
    {
      field: 'tanggal_pengembalian',
      headerName: 'Tanggal Pengembalian',
      width: 150,
      sortable: true,
      renderCell: (params) => {
        return params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-';
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Chip
          label={getStatusText(params.value)}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ color: 'white' }}
        />
      ),
    },
    {
      field: 'total_barang',
      headerName: 'Total Barang',
      width: 120,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Lihat Detail">
            <IconButton
              size="small"
              onClick={() => navigate(`/peminjaman/${params.row.id}`)}
              sx={{ p: { xs: 0.5, sm: 1 } }}
            >
              <VisibilityIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filterComponent = (
    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 2 } }}>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select
          fullWidth
          label="Jenis Transaksi"
          value={jenisTransaksi}
          onChange={(e) => setJenisTransaksi(e.target.value)}
          size="small"
          sx={{
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        >
          <MenuItem value="">Semua</MenuItem>
          <MenuItem value="peminjaman">Peminjaman</MenuItem>
          <MenuItem value="pengembalian">Pengembalian</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select
          fullWidth
          label="Status"
          value={statusTransaksi}
          onChange={(e) => setStatusTransaksi(e.target.value)}
          size="small"
          sx={{
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        >
          <MenuItem value="">Semua</MenuItem>
          <MenuItem value="pending">Menunggu Persetujuan</MenuItem>
          <MenuItem value="disetujui">Disetujui</MenuItem>
          <MenuItem value="ditolak">Ditolak</MenuItem>
          <MenuItem value="dipinjam">Sedang Dipinjam</MenuItem>
          <MenuItem value="dikembalikan">Dikembalikan</MenuItem>
          <MenuItem value="terlambat">Terlambat</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          select
          fullWidth
          label="Pengguna"
          value={idPengguna}
          onChange={(e) => setIdPengguna(e.target.value)}
          size="small"
          sx={{
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        >
          <MenuItem value="">Semua</MenuItem>
          {pengguna.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.nama}
            </MenuItem>
          ))}
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
                fullWidth: true,
                sx: {
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }
                }
              },
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
                fullWidth: true,
                sx: {
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }
                }
              },
            }}
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title="Histori Transaksi"
        subtitle="Riwayat transaksi peminjaman dan pengembalian barang"
        actions={[
          {
            label: showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter',
            icon: <FilterListIcon />,
            onClick: () => setShowFilters(!showFilters),
            variant: 'outlined',
          },
        ]}
      />

      {showFilters && (
        <Box sx={{ mb: 3 }}>
          {filterComponent}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={handleClearFilters}
            >
              Bersihkan Filter
            </Typography>
          </Box>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={transaksi}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearch={handleSearch}
        searchPlaceholder="Cari berdasarkan kode transaksi atau nama peminjam..."
      />
    </Box>
  );
};

export default HistoriTransaksi;