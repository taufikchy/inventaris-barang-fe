import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { toast } from "react-toastify";
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
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  Dangerous as DangerousIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import PageHeader from '../components/PageHeader';
import InfoCard from '../components/InfoCard';
import PDFTestButton from '../components/PDFTestButton';

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
    barangBaik: 0,
    barangRusakRingan: 0,
    barangRusakBerat: 0,
    totalTransaksiHariIni: 0
  });
  const [recentPeminjaman, setRecentPeminjaman] = useState([]);
  const [recentTransaksi, setRecentTransaksi] = useState([]);
  const [transaksiPerJenis, setTransaksiPerJenis] = useState([]);
  const [distribusiPerKondisi, setDistribusiPerKondisi] = useState([]);
  const [barangPerLokasi, setBarangPerLokasi] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the API
        const response = await axios.get('/api/dashboard/stats');
        
        if (response.data.sukses) {
          const { stats, recentPeminjaman, distribusiPerKondisi, barangPerLokasi } = response.data.data;
          
          setStats({
            totalBarang: stats.totalBarang,
            totalKategori: stats.totalKategori,
            totalPeminjaman: stats.totalPeminjaman,
            barangRusak: stats.barangRusak,
            barangBaik: stats.barangBaik || 0,
            barangRusakRingan: stats.barangRusakRingan || 0,
            barangRusakBerat: stats.barangRusakBerat || 0,
            totalTransaksiHariIni: stats.totalTransaksiHariIni || 0
          });
          
          // Format peminjaman data
          const formattedPeminjaman = recentPeminjaman.map(item => ({
            id: item.id,
            nama_peminjam: item.nama_peminjam || (item.pengguna ? item.pengguna.nama : 'Tidak ada nama'),
            tanggal_pinjam: item.tanggal_pinjam,
            tanggal_kembali_harapan: item.tanggal_kembali_harapan,
            status: item.status,
          }));
          
          setRecentPeminjaman(formattedPeminjaman);
          
          // Set recent transactions and transaction stats
          setRecentTransaksi(response.data.data.recentTransaksi || []);
          setTransaksiPerJenis(response.data.data.transaksiPerJenis || []);
          setDistribusiPerKondisi(distribusiPerKondisi);
          setBarangPerLokasi(barangPerLokasi);
        } else {
          toast.error('Gagal memuat data dashboard');
          // Fallback to empty data
          setStats({
            totalBarang: 0,
            totalKategori: 0,
            totalPeminjaman: 0,
            barangRusak: 0,
            barangBaik: 0,
            barangRusakRingan: 0,
            barangRusakBerat: 0,
          });
          setRecentPeminjaman([]);
          setDistribusiPerKondisi([]);
          setBarangPerLokasi([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Terjadi kesalahan saat memuat data dashboard');
        setLoading(false);
        
        // Fallback to empty data
        setStats({
          totalBarang: 0,
          totalKategori: 0,
          totalPeminjaman: 0,
          barangRusak: 0,
          barangBaik: 0,
          barangRusakRingan: 0,
          barangRusakBerat: 0,
        });
        setRecentPeminjaman([]);
        setDistribusiPerKondisi([]);
        setBarangPerLokasi([]);
      }
    };

    fetchDashboardData();
  }, []);

  // Fungsi untuk mengurutkan lokasi berdasarkan nomor lab
  const sortLocations = (locations) => {
    return [...locations].sort((a, b) => {
      // Ekstrak angka dari nama lokasi (misalnya "Lab 1" -> 1)
      const getLabNumber = (name) => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      
      const numA = getLabNumber(a.nama);
      const numB = getLabNumber(b.nama);
      
      return numA - numB;
    });
  };

  // Prepare chart data
  const pieChartData = {
    labels: distribusiPerKondisi.map(item => item.nama),
    datasets: [
      {
        data: distribusiPerKondisi.map(item => item.jumlah),
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Urutkan lokasi untuk grafik bar
  const sortedLocations = sortLocations(barangPerLokasi);

  const barChartData = {
    labels: sortedLocations.map(item => item.nama),
    datasets: [
      {
        label: 'Jumlah Barang',
        data: sortedLocations.map(item => item.jumlah),
        backgroundColor: [
          '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
          '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
        ],
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
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
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4} lg={2.4}>
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
        <Grid item xs={12} sm={6} md={2.4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Barang Baik"
              value={stats.barangBaik}
              icon={<CheckCircleIcon />}
              color="success"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={2.4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Rusak Ringan"
              value={stats.barangRusakRingan}
              icon={<BuildIcon />}
              color="warning"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={2.4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Rusak Berat"
              value={stats.barangRusakBerat}
              icon={<DangerousIcon />}
              color="error"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={2.4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height={120} />
          ) : (
            <InfoCard
              title="Peminjaman Aktif"
              value={stats.totalPeminjaman}
              icon={<SwapHorizIcon />}
              color="info"
            />
          )}
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Distribusi Barang per Ruangan Chart */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribusi Barang per Ruangan
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ 
                  height: { xs: 250, sm: 300 },
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <Bar data={barChartData} options={{
                    ...barChartOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      ...barChartOptions.scales,
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 0
                        }
                      }
                    }
                  }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribusi Barang per Kondisi Chart */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribusi Barang per Kondisi
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ 
                  height: { xs: 250, sm: 300 }, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <Pie data={pieChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true
                        }
                      }
                    }
                  }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Peminjaman Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="h6">Peminjaman Aktif</Typography>
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
                <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Peminjam</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tanggal Pinjam</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPeminjaman.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {row.nama_peminjam}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography variant="body2">
                              {formatDate(row.tanggal_pinjam)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                              color={getStatusColor(row.status)}
                              size="small"
                              sx={{
                                color: 'white',
                                fontWeight: 'bold'
                              }}
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
        
        {/* Recent Transactions Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="h6">Transaksi Terbaru</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/transaksi')}
                >
                  Lihat Semua
                </Button>
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Barang</TableCell>
                        <TableCell>Jenis</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Jumlah</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Tanggal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTransaksi.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={{ xs: 2, sm: 3, md: 4 }} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Tidak ada data transaksi
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentTransaksi.map((transaksi) => (
                          <TableRow key={transaksi.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {transaksi.barang?.nama || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaksi.jenis_transaksi === 'masuk' ? 'Masuk' :
                                       transaksi.jenis_transaksi === 'keluar' ? 'Keluar' :
                                       transaksi.jenis_transaksi === 'rusak' ? 'Rusak' : 'Hilang'}
                                color={transaksi.jenis_transaksi === 'masuk' ? 'success' :
                                       transaksi.jenis_transaksi === 'keluar' ? 'primary' :
                                       transaksi.jenis_transaksi === 'rusak' ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              <Typography variant="body2">
                                {transaksi.jumlah}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2">
                                {formatDate(transaksi.tanggal_transaksi)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PDF Test Button - for development */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <PDFTestButton />
      </Box>
    </>
  );
};

export default Dashboard;