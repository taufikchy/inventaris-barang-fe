import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  SwapHoriz as SwapHorizIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import PageHeader from '../components/PageHeader';
import InfoCard from '../components/InfoCard';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBarang: 0,
    totalKategori: 0,
    totalPeminjaman: 0,
    barangRusak: 0,
  });
  const [recentPeminjaman, setRecentPeminjaman] = useState([]);
  const [barangPerKategori, setBarangPerKategori] = useState([]);
  const [kondisiBarang, setKondisiBarang] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real application, you would fetch this data from your API
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          totalBarang: 156,
          totalKategori: 8,
          totalPeminjaman: 24,
          barangRusak: 5,
        });
        
        setRecentPeminjaman([
          {
            id: 1,
            nama_peminjam: 'Budi Santoso',
            tanggal_pinjam: '2023-07-15',
            tanggal_kembali_harapan: '2023-07-20',
            status: 'dipinjam',
          },
          {
            id: 2,
            nama_peminjam: 'Ani Wijaya',
            tanggal_pinjam: '2023-07-14',
            tanggal_kembali_harapan: '2023-07-21',
            status: 'dipinjam',
          },
          {
            id: 3,
            nama_peminjam: 'Deni Kurniawan',
            tanggal_pinjam: '2023-07-10',
            tanggal_kembali_harapan: '2023-07-17',
            status: 'dikembalikan',
          },
          {
            id: 4,
            nama_peminjam: 'Siti Rahayu',
            tanggal_pinjam: '2023-07-08',
            tanggal_kembali_harapan: '2023-07-15',
            status: 'dikembalikan',
          },
        ]);
        
        setBarangPerKategori([
          { nama: 'Komputer', jumlah: 45 },
          { nama: 'Periferal', jumlah: 30 },
          { nama: 'Jaringan', jumlah: 25 },
          { nama: 'Alat Ukur', jumlah: 20 },
          { nama: 'Media Pembelajaran', jumlah: 15 },
          { nama: 'Lainnya', jumlah: 21 },
        ]);
        
        setKondisiBarang([
          { kondisi: 'Baik', jumlah: 130 },
          { kondisi: 'Rusak Ringan', jumlah: 21 },
          { kondisi: 'Rusak Berat', jumlah: 5 },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const pieChartData = {
    labels: kondisiBarang.map(item => item.kondisi),
    datasets: [
      {
        data: kondisiBarang.map(item => item.jumlah),
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: barangPerKategori.map(item => item.nama),
    datasets: [
      {
        label: 'Jumlah Barang',
        data: barangPerKategori.map(item => item.jumlah),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Barang per Kategori',
      },
    },
  };

  // Status chip color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'dipinjam':
        return 'primary';
      case 'dikembalikan':
        return 'success';
      case 'terlambat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format date to Indonesian format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <>
      <PageHeader title="Dashboard" />

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Total Barang"
              value={stats.totalBarang}
              icon={<InventoryIcon />}
              color="primary"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Total Kategori"
              value={stats.totalKategori}
              icon={<CategoryIcon />}
              color="success"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Peminjaman Aktif"
              value={stats.totalPeminjaman}
              icon={<SwapHorizIcon />}
              color="warning"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Barang Rusak"
              value={stats.barangRusak}
              icon={<WarningIcon />}
              color="error"
            />
          )}
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3}>
        {/* Barang per Kategori Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribusi Barang per Kategori
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ height: 300 }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kondisi Barang Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kondisi Barang
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie data={pieChartData} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Peminjaman Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Peminjaman Terbaru</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/peminjaman')}
                >
                  Lihat Semua
                </Button>
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Peminjam</TableCell>
                        <TableCell>Tanggal Pinjam</TableCell>
                        <TableCell>Tanggal Kembali</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPeminjaman.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.nama_peminjam}</TableCell>
                          <TableCell>{formatDate(row.tanggal_pinjam)}</TableCell>
                          <TableCell>{formatDate(row.tanggal_kembali_harapan)}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                              color={getStatusColor(row.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => navigate(`/peminjaman/${row.id}`)}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;