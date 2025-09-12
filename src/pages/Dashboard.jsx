import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { toast } from "react-toastify";
import dayjs from 'dayjs';
import 'dayjs/locale/id';
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

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const navigate = useNavigate();
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
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
  const [recentAktivitas, setRecentAktivitas] = useState([]);
  const [transaksiPerJenis, setTransaksiPerJenis] = useState([]);
  const [distribusiPerKondisi, setDistribusiPerKondisi] = useState([]);
  const [barangPerLokasi, setBarangPerLokasi] = useState([]);
  const [stokBahanMenupis, setStokBahanMenupis] = useState([]);

  // Function to format module names
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

  // Function to fetch stok bahan yang menipis
  const fetchStokBahanMenupis = async () => {
    try {
      const response = await axios.get('/api/barang');
      if (response.data.sukses) {
        const barangBahan = response.data.data.filter(barang => 
          barang.kategori?.tipe === 'bahan' && barang.stok_tersisa !== undefined
        );
        
        const bahanMenupis = barangBahan.filter(barang => {
          const persentaseStok = (barang.stok_tersisa / barang.jumlah) * 100;
          return persentaseStok <= 20; // Stok menipis jika <= 20%
        });
        
        setStokBahanMenupis(bahanMenupis);
      }
    } catch (error) {
      console.error('Error fetching stok bahan menipis:', error);
    }
  };

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
            total_barang_dipinjam: item.total_barang_dipinjam || 0,
          }));
          
          setRecentPeminjaman(formattedPeminjaman);
          
          // Set recent activities and transaction stats
          setRecentAktivitas(response.data.data.recentAktivitas || []);
          setTransaksiPerJenis(response.data.data.transaksiPerJenis || []);
          setDistribusiPerKondisi(distribusiPerKondisi);
          setBarangPerLokasi(barangPerLokasi);
          
          // Fetch stok bahan yang menipis
          fetchStokBahanMenupis();
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

  // Cleanup chart instances on unmount
  useEffect(() => {
    return () => {
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
      if (barChartRef.current) {
        barChartRef.current.destroy();
      }
    };
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

  // Prepare chart data with proper color mapping and sorting
  const getKondisiColor = (nama) => {
    switch (nama) {
      case 'Baik':
        return '#22c55e'; // hijau
      case 'Rusak Ringan':
        return '#f59e0b'; // kuning
      case 'Rusak Berat':
        return '#ef4444'; // merah
      default:
        return '#6b7280'; // abu-abu
    }
  };

  // Urutkan distribusi kondisi: Baik, Rusak Ringan, Rusak Berat
  const sortedDistribusiPerKondisi = [...distribusiPerKondisi].sort((a, b) => {
    const order = { 'Baik': 1, 'Rusak Ringan': 2, 'Rusak Berat': 3 };
    return (order[a.nama] || 999) - (order[b.nama] || 999);
  });

  const pieChartData = {
    labels: sortedDistribusiPerKondisi.map(item => item.nama),
    datasets: [
      {
        data: sortedDistribusiPerKondisi.map(item => item.jumlah),
        backgroundColor: sortedDistribusiPerKondisi.map(item => getKondisiColor(item.nama)),
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
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const lokasi = barChartData.labels[elementIndex];
        navigate(`/barang?lokasi=${encodeURIComponent(lokasi)}`);
      }
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
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} sm={6} md={4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height="120px" />
          ) : (
            <InfoCard
              title="Total Barang"
              value={stats.totalBarang}
              icon={<InventoryIcon />}
              color="primary"
              onClick={() => navigate('/barang')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height="120px" />
          ) : (
            <InfoCard
              title="Barang Baik"
              value={stats.barangBaik}
              icon={<CheckCircleIcon />}
              color="success"
              onClick={() => navigate('/barang?kondisi=Baik')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height="120px" />
          ) : (
            <InfoCard
              title="Rusak Ringan"
              value={stats.barangRusakRingan}
              icon={<BuildIcon />}
              color="warning"
              onClick={() => navigate('/barang?kondisi=Rusak Ringan')}
            />
          )}
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height="120px" />
          ) : (
            <InfoCard
              title="Rusak Berat"
              value={stats.barangRusakBerat}
              icon={<DangerousIcon />}
              color="error"
              onClick={() => navigate('/barang?kondisi=Rusak Berat')}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          {loading ? (
            <Skeleton variant="rounded" height="120px" />
          ) : (
            <InfoCard
              title="Peminjaman Aktif"
              value={stats.totalPeminjaman}
              icon={<SwapHorizIcon />}
              color="info"
              onClick={() => navigate('/peminjaman?status=dipinjam')}
            />
          )}
        </Grid>
      </Grid>

      {/* Peringatan Stok Bahan Menipis */}
      {stokBahanMenupis.length > 0 && (
        <Card sx={{ mb: { xs: 3, sm: 4 }, border: '2px solid #f59e0b', backgroundColor: '#fef3c7' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
              <WarningIcon sx={{ color: '#f59e0b', mr: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              <Typography variant="h6" sx={{ color: '#92400e', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Peringatan: Stok Bahan Menipis!
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: { xs: 1.5, sm: 2 }, color: '#92400e', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Beberapa bahan memiliki stok yang menipis dan perlu segera diisi ulang:
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {stokBahanMenupis.map((barang) => {
                const persentaseStok = ((barang.stok_tersisa || 0) / barang.jumlah) * 100;
                return (
                  <Grid item xs={12} sm={6} md={4} key={barang.id}>
                    <Box 
                      sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        border: '1px solid #f59e0b', 
                        borderRadius: 1, 
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#fef3c7'
                        }
                      }}
                      onClick={() => navigate(`/barang?search=${encodeURIComponent(barang.nama)}`)}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#92400e', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {barang.nama}
                      </Typography>
                      {/* Tampilkan unit tersisa untuk satuan set */}
                      {barang.satuan === 'set' && barang.unit_per_set ? (
                        <>
                          <Typography variant="body2" sx={{ color: '#92400e', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Stok tersisa: {barang.stok_tersisa || 0} set ({(barang.stok_tersisa || 0) * barang.unit_per_set} unit)
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#92400e', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Dari total: {barang.jumlah} set ({barang.jumlah * barang.unit_per_set} unit)
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ color: '#92400e', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Stok tersisa: {barang.stok_tersisa || 0} {barang.satuan}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#92400e', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Dari total: {barang.jumlah} {barang.satuan}
                          </Typography>
                        </>
                      )}
                      <Chip 
                        label={`${persentaseStok.toFixed(1)}% tersisa`}
                        size="small"
                        color={persentaseStok <= 10 ? 'error' : 'warning'}
                        sx={{ 
                          mt: 1, 
                          color: 'white',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          height: { xs: 24, sm: 32 }
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
            <Box sx={{ mt: { xs: 1.5, sm: 2 }, textAlign: 'right' }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => navigate('/barang?kategori_tipe=bahan')}
                endIcon={<ArrowForwardIcon />}
                size="small"
                sx={{ padding: { xs: '4px 8px', sm: '6px 16px' } }}
              >
                Lihat Semua Bahan
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Charts and Tables */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Distribusi Barang per Ruangan Chart */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Distribusi Barang per Ruangan
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height="300px" />
              ) : (
                <Box sx={{ 
                  height: { xs: 200, sm: 250, md: 300 },
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <Bar 
                    key={`bar-chart-${barangPerLokasi.length}`}
                    ref={barChartRef}
                    data={barChartData} 
                    options={{
                      ...barChartOptions,
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        ...barChartOptions.scales,
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            font: {
                              size: 12
                            }
                          }
                        },
                        y: {
                          ticks: {
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribusi Barang per Kondisi Chart */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Distribusi Barang per Kondisi
              </Typography>
              {loading ? (
                <Skeleton variant="circular" width="250px" height="250px" sx={{ mx: 'auto' }} />
              ) : (
                <Box sx={{ 
                  height: { xs: 200, sm: 250, md: 300 }, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <Pie 
                    key={`pie-chart-${distribusiPerKondisi.length}`}
                    ref={pieChartRef}
                    data={pieChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                              size: 12
                            }
                          }
                        }
                      },
                      onClick: (event, elements) => {
                        if (elements.length > 0) {
                          const elementIndex = elements[0].index;
                          const kondisiLabel = pieChartData.labels[elementIndex];
                          // Map display name back to backend value
                          let kondisiValue = '';
                          if (kondisiLabel === 'Baik') kondisiValue = 'baik';
                          else if (kondisiLabel === 'Rusak Ringan') kondisiValue = 'rusak_ringan';
                          else if (kondisiLabel === 'Rusak Berat') kondisiValue = 'rusak_berat';
                          
                          if (kondisiValue) {
                            navigate(`/barang?kondisi=${encodeURIComponent(kondisiValue)}`);
                          }
                        }
                      },
                    }} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Peminjaman Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Peminjaman Aktif</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/peminjaman')}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Lihat Semua
                </Button>
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height="200px" />
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto', flex: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Peminjam</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Tanggal Pinjam</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total Barang</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPeminjaman.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Tidak ada peminjaman aktif
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentPeminjaman.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {row.nama_peminjam}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {formatDate(row.tanggal_pinjam)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {row.total_barang_dipinjam || 0} unit
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                                color={getStatusColor(row.status)}
                                size="small"
                                sx={{
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 }
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => navigate(`/peminjaman/${row.id}`)}
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              >
                                Detail
                              </Button>
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
        
        {/* Recent Activities Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Aktivitas Terbaru</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/histori-aktivitas')}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Lihat Semua
                </Button>
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height="200px" />
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto', flex: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Pengguna</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Aktivitas</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Modul</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Waktu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentAktivitas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={{ xs: 2, md: 3, lg: 4 }} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Tidak ada data aktivitas
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentAktivitas.map((aktivitas) => (
                          <TableRow key={aktivitas.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {aktivitas.pengguna?.nama || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={aktivitas.jenis_aktivitas === 'create' ? 'Tambah' :
                                       aktivitas.jenis_aktivitas === 'update' ? 'Ubah' :
                                       aktivitas.jenis_aktivitas === 'delete' ? 'Hapus' :
                                       aktivitas.jenis_aktivitas === 'login' ? 'Login' : 'Logout'}
                                color={aktivitas.jenis_aktivitas === 'create' ? 'success' :
                                       aktivitas.jenis_aktivitas === 'update' ? 'primary' :
                                       aktivitas.jenis_aktivitas === 'delete' ? 'error' :
                                       aktivitas.jenis_aktivitas === 'login' ? 'info' : 'secondary'}
                                size="small"
                                sx={{
                                  '& .MuiChip-label': {
                                    color: 'white'
                                  },
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 },
                                  ...(aktivitas.jenis_aktivitas === 'logout' && {
                                    backgroundColor: '#424242',
                                    '& .MuiChip-label': {
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }
                                  })
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {getModulLabel(aktivitas.modul)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{dayjs(aktivitas.waktu_aktivitas).locale('id').format('DD MMMM YYYY')}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{dayjs(aktivitas.waktu_aktivitas).locale('id').format('HH:mm')}</Typography>
                              </Box>
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


    </>
  );
};

export default Dashboard;