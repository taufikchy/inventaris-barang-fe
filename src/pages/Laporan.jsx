import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axios';
import PDFGenerator from '../components/PDFGenerator';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  ViewColumn as ExcelIcon,
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Laporan = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exportMenu, setExportMenu] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tahunFilter, setTahunFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [lokasiFilter, setLokasiFilter] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sumberDanaFilter, setSumberDanaFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Data states
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [loanData, setLoanData] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [conditionData, setConditionData] = useState([]);
  
  // Filter dropdown data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sumberDanaList, setSumberDanaList] = useState([]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle export menu
  const handleExportClick = (event) => {
    setExportMenu(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenu(null);
  };

  const handleExport = async (action) => {
    try {
      const pdfGenerator = new PDFGenerator();
      let reportType = '';
      let data = [];
      let filters = {};

      // Prepare filters
      if (tahunFilter && tahunFilter !== 'all') {
        filters.tahun = tahunFilter;
      }
      if (kategoriFilter) {
        const selectedCategory = categories.find(cat => cat.id === kategoriFilter);
        filters.kategori = selectedCategory?.nama || kategoriFilter;
      }
      if (lokasiFilter) {
        const selectedLocation = locations.find(loc => loc.id === lokasiFilter);
        filters.lokasi = selectedLocation?.nama || lokasiFilter;
      }
      if (kondisiFilter) {
        filters.kondisi = kondisiFilter;
      }
      if (statusFilter) {
        filters.status = statusFilter;
      }
      if (sumberDanaFilter) {
        const selectedSumberDana = sumberDanaList.find(sd => sd.nama === sumberDanaFilter);
        filters.sumber_dana = selectedSumberDana?.nama || sumberDanaFilter;
      }
      if (startDate && endDate) {
        filters.startDate = startDate.format('YYYY-MM-DD');
        filters.endDate = endDate.format('YYYY-MM-DD');
      }

      // Generate PDF based on active tab
      if (activeTab === 0) {
        // Laporan Inventaris
        reportType = 'Inventaris';
        data = filteredInventoryData;
        await pdfGenerator.generateInventoryReport(data, filters, inventorySummary);
      } else if (activeTab === 1) {
        // Laporan Peminjaman
        reportType = 'Peminjaman';
        data = filteredLoanData;
        await pdfGenerator.generateLoanReport(data, filters);
      } else if (activeTab === 2) {
        // Laporan Kondisi
        reportType = 'Kondisi';
        data = filteredConditionData;
        
        // Calculate summary for condition report
        const conditionSummary = {
          total_barang: data.length,
          jumlah_per_kondisi: {
            baik: data.filter(item => item.kondisi === 'baik').length,
            rusak_ringan: data.filter(item => item.kondisi === 'rusak_ringan').length,
            rusak_berat: data.filter(item => item.kondisi === 'rusak_berat').length
          }
        };
        
        await pdfGenerator.generateConditionReport(data, filters, conditionSummary);
      }

      if (action === 'download') {
        pdfGenerator.saveReportPDF(reportType);
        toast.success(`Laporan ${reportType} berhasil diunduh`);
      } else if (action === 'preview') {
        pdfGenerator.previewReportPDF(reportType);
        toast.success(`Preview laporan ${reportType} dibuka`);
      }
    } catch (error) {
      console.error(`Error generating ${activeTab === 0 ? 'Inventory' : activeTab === 1 ? 'Loan' : 'Condition'} PDF:`, error);
      toast.error('Gagal membuat PDF. Silakan coba lagi.');
    }
    handleExportClose();
  };

  // Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/kategori/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch locations for filter dropdown
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/lokasi/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch conditions for filter dropdown
  const fetchConditions = async () => {
    try {
      // Set static conditions using frontend formatted values for client-side filtering
      setConditions([
        { value: 'Baik', label: 'Baik' },
        { value: 'Rusak Ringan', label: 'Rusak Ringan' },
        { value: 'Rusak Berat', label: 'Rusak Berat' }
      ]);
    } catch (error) {
      console.error('Error setting conditions:', error);
    }
  };

  // Fetch statuses for filter dropdown
  const fetchStatuses = async () => {
    try {
      // Set static statuses using frontend formatted values for client-side filtering
      setStatuses([
        { value: 'Tersedia', label: 'Tersedia' },
        { value: 'Dipinjam', label: 'Dipinjam' },
        { value: 'Perbaikan', label: 'Perbaikan' },
        { value: 'Habis', label: 'Habis' }
      ]);
    } catch (error) {
      console.error('Error setting statuses:', error);
    }
  };

  // Fetch sumber dana for filter dropdown
  const fetchSumberDana = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sumber-dana/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setSumberDanaList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sumber dana:', error);
    }
  };



  // Fetch inventory report data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (kategoriFilter) {
        const selectedCategory = categories.find(cat => cat.id === kategoriFilter);
        if (selectedCategory) {
          params.append('kategori', selectedCategory.id);
        }
      }
      if (lokasiFilter) {
        const selectedLocation = locations.find(loc => loc.id === lokasiFilter);
        if (selectedLocation) {
          params.append('lokasi', selectedLocation.id);
        }
      }
      if (kondisiFilter) {
        params.append('kondisi', kondisiFilter);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (sumberDanaFilter) {
        params.append('sumber_dana', sumberDanaFilter);
      }
      if (startDate && endDate) {
        params.append('tanggal_mulai', startDate.format('YYYY-MM-DD'));
        params.append('tanggal_akhir', endDate.format('YYYY-MM-DD'));
      }
      
      const url = params.toString() ? `/api/laporan/inventaris?${params.toString()}` : '/api/laporan/inventaris';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setInventoryData(response.data.data.inventaris);
        setInventorySummary(response.data.data.ringkasan);
      } else {
        toast.error(response.data.pesan || 'Gagal memuat data inventaris');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error(error.response?.data?.pesan || 'Gagal memuat data inventaris');
      setLoading(false);
    }
  };

  // Fetch loan report data
  const fetchLoanData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (startDate && endDate) {
        params.append('tanggal_mulai', startDate.format('YYYY-MM-DD'));
        params.append('tanggal_akhir', endDate.format('YYYY-MM-DD'));
      }
      
      const url = params.toString() ? `/api/laporan/peminjaman?${params.toString()}` : '/api/laporan/peminjaman';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setLoanData(response.data.data.peminjaman);
        setLoanSummary(response.data.data.ringkasan);
      } else {
        toast.error(response.data.pesan || 'Gagal memuat data peminjaman');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast.error(error.response?.data?.pesan || 'Gagal memuat data peminjaman');
      setLoading(false);
    }
  };

  // Fetch condition report data
  const fetchConditionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (kategoriFilter) {
        const selectedCategory = categories.find(cat => cat.id === kategoriFilter);
        if (selectedCategory) {
          params.append('kategori', selectedCategory.id);
        }
      }
      if (lokasiFilter) {
        const selectedLocation = locations.find(loc => loc.id === lokasiFilter);
        if (selectedLocation) {
          params.append('lokasi', selectedLocation.id);
        }
      }
      if (kondisiFilter) {
        params.append('kondisi', kondisiFilter);
      }
      if (sumberDanaFilter) {
        params.append('sumber_dana', sumberDanaFilter);
      }
      if (startDate && endDate) {
        params.append('tanggal_mulai', startDate.format('YYYY-MM-DD'));
        params.append('tanggal_akhir', endDate.format('YYYY-MM-DD'));
      }
      
      const url = params.toString() ? `/api/laporan/kondisi?${params.toString()}` : '/api/laporan/kondisi';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setConditionData(response.data.data.barang);
      } else {
        toast.error(response.data.pesan || 'Gagal memuat data kondisi barang');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching condition data:', error);
      toast.error(error.response?.data?.pesan || 'Gagal memuat data kondisi barang');
      setLoading(false);
    }
  };



  // Load initial data
  useEffect(() => {
    fetchInventoryData();
    fetchCategories();
    fetchLocations();
    fetchConditions();
    fetchStatuses();
    fetchSumberDana();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 0) {
      fetchInventoryData();
    } else if (activeTab === 1) {
      fetchLoanData();
    } else if (activeTab === 2) {
      fetchConditionData();
    }
  }, [activeTab]);

  // Refetch data when filters change for inventory tab
  useEffect(() => {
    if (activeTab === 0 && categories.length > 0 && locations.length > 0) {
      fetchInventoryData();
    }
  }, [kategoriFilter, lokasiFilter, kondisiFilter, statusFilter, sumberDanaFilter, startDate, endDate, categories, locations]);

  // Refetch data when filters change for condition tab
  useEffect(() => {
    if (activeTab === 2 && categories.length > 0 && locations.length > 0) {
      fetchConditionData();
    }
  }, [kategoriFilter, lokasiFilter, kondisiFilter, sumberDanaFilter, startDate, endDate, categories, locations]);

  // Apply filters
  const filteredInventoryData = inventoryData.filter(item => {
    const itemDate = dayjs(item.tanggal_perolehan);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const tahunMatch = !tahunFilter || (item.tahun_pengadaan && item.tahun_pengadaan.toString() === tahunFilter.toString()) || (itemDate.year() === parseInt(tahunFilter));
    const kategoriMatch = !kategoriFilter || (item.kategori?.nama || item.kategori) === kategoriFilter;
    const lokasiMatch = !lokasiFilter || (item.lokasi?.nama || item.lokasi) === lokasiFilter;
    const kondisiMatch = !kondisiFilter || item.kondisi === kondisiFilter;
    const statusMatch = !statusFilter || item.status === statusFilter;
    const sumberDanaMatch = !sumberDanaFilter || (item.sumber_dana?.nama || item.sumber_dana) === sumberDanaFilter;
    
    return dateMatch && tahunMatch && kategoriMatch && lokasiMatch && kondisiMatch && statusMatch && sumberDanaMatch;
  });

  const filteredLoanData = loanData.filter(item => {
    const itemDate = dayjs(item.tanggal_pinjam);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const tahunMatch = !tahunFilter || itemDate.year() === parseInt(tahunFilter);
    const statusMatch = !statusFilter || item.status === statusFilter;
    
    return dateMatch && tahunMatch && statusMatch;
  });

  const filteredConditionData = conditionData.filter(item => {
    const itemDate = dayjs(item.tanggal_perolehan);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const tahunMatch = !tahunFilter || (item.tahun_pengadaan && item.tahun_pengadaan.toString() === tahunFilter.toString()) || (itemDate.year() === parseInt(tahunFilter));
    const kategoriMatch = !kategoriFilter || (item.kategori?.nama || item.kategori) === kategoriFilter;
    const lokasiMatch = !lokasiFilter || (item.lokasi?.nama || item.lokasi) === lokasiFilter;
    const kondisiMatch = !kondisiFilter || item.kondisi === kondisiFilter;
    const sumberDanaMatch = !sumberDanaFilter || (item.sumber_dana?.nama || item.sumber_dana) === sumberDanaFilter;
    
    return dateMatch && tahunMatch && kategoriMatch && lokasiMatch && kondisiMatch && sumberDanaMatch;
   });



  // Table columns definition
  const inventoryColumns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'nama', label: 'Nama Barang', sortable: true },
    { id: 'kategori', label: 'Kategori', sortable: true, format: (value) => value?.nama || value || '-' },
    { id: 'lokasi', label: 'Lokasi', sortable: true, format: (value) => value?.nama || value || '-' },
    { id: 'kondisi', label: 'Kondisi', sortable: true, format: (value) => {
      const kondisiLabels = {
        'baik': 'Baik',
        'rusak_ringan': 'Rusak Ringan',
        'rusak_berat': 'Rusak Berat'
      };
      return kondisiLabels[value] || value || '-';
    }},
    { id: 'tahun_pengadaan', label: 'Tahun Pengadaan', sortable: true, format: (value) => {
      return value || '-';
    }},
    { id: 'tanggal_perolehan', label: 'Tanggal Pencatatan Barang', sortable: true, format: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }},
    { id: 'sumber_dana', label: 'Sumber Dana', sortable: true, format: (value) => {
      return value?.nama || value || '-';
    }},
    { id: 'status', label: 'Status', sortable: true, format: (value) => {
      const statusLabels = {
        'tersedia': 'Tersedia',
        'dipinjam': 'Dipinjam',
        'perbaikan': 'Perbaikan',
        'habis': 'Habis'
      };
      return statusLabels[value] || value || '-';
    }},
  ];

  const loanColumns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
    { id: 'id', label: 'Kode', sortable: true, format: (value) => `PJM-${value.toString().padStart(3, '0')}` },
    { id: 'nama_peminjam', label: 'Peminjam', sortable: true },
    { id: 'tanggal_pinjam', label: 'Tanggal Pinjam', sortable: true, format: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }},
    { id: 'tanggal_kembali_aktual', label: 'Tanggal Kembali', sortable: true, format: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }},
    { id: 'status', label: 'Status', sortable: true, format: (value) => {
      const statusLabels = {
        'menunggu_persetujuan': 'Menunggu Persetujuan',
        'disetujui': 'Disetujui',
        'ditolak': 'Ditolak',
        'dipinjam': 'Dipinjam',
        'dikembalikan': 'Dikembalikan',
        'terlambat': 'Terlambat'
      };
      return statusLabels[value] || value || '-';
    }},
    { 
      id: 'jumlah', 
      label: 'Jumlah Barang', 
      sortable: true,
      format: (value, row) => {
        if (row.detail_peminjaman && row.detail_peminjaman.length > 0) {
          return row.detail_peminjaman.reduce((total, detail) => total + (detail.jumlah || 0), 0);
        }
        return '-';
      }
    },
    { 
      id: 'catatan', 
      label: 'Keterangan', 
      sortable: true,
      format: (value, row) => {
        return row.catatan || '-';
      }
    },
  ];

  const conditionColumns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'nama', label: 'Nama Barang', sortable: true },
    { id: 'kategori', label: 'Kategori', sortable: true, format: (value) => value?.nama || value || '-' },
    { id: 'lokasi', label: 'Lokasi', sortable: true, format: (value) => value?.nama || value || '-' },
    { id: 'kondisi', label: 'Kondisi', sortable: true, format: (value) => {
      const kondisiLabels = {
        'baik': 'Baik',
        'rusak_ringan': 'Rusak Ringan',
        'rusak_berat': 'Rusak Berat'
      };
      return kondisiLabels[value] || value || '-';
    }},
    { id: 'keterangan', label: 'Keterangan', sortable: true },
  ];



  return (
    <>
      <PageHeader
        title="Laporan"
        actionText="Ekspor"
        actionIcon={<FileDownloadIcon />}
        onActionClick={handleExportClick}
      />

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenu}
        open={Boolean(exportMenu)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport('download')}>
          <FileDownloadIcon sx={{ mr: 1 }} /> Download PDF
        </MenuItem>
        <MenuItem onClick={() => handleExport('preview')}>
          <VisibilityIcon sx={{ mr: 1 }} /> Preview PDF
        </MenuItem>
      </Menu>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Filter Laporan
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            </Button>
          </Box>
          {showFilters && (
            <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={Array.from({ length: new Date().getFullYear() - 2007 + 1 }, (_, i) => {
                   const year = new Date().getFullYear() - i;
                   return year.toString();
                 })}
                value={tahunFilter}
                onChange={(event, newValue) => {
                  setTahunFilter(newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  setTahunFilter(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tahun"
                    placeholder="Ketik atau pilih tahun"
                    type="number"
                    InputProps={{
                      ...params.InputProps,
                      inputProps: {
                        ...params.inputProps,
                        min: 1900,
                        max: new Date().getFullYear() + 10
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <DatePicker
                label="Dari Tanggal"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <DatePicker
                label="Sampai Tanggal"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={kategoriFilter}
                  label="Kategori"
                  onChange={(e) => setKategoriFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.nama}>
                      {category.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Lokasi</InputLabel>
                <Select
                  value={lokasiFilter}
                  label="Lokasi"
                  onChange={(e) => setLokasiFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.nama}>
                      {location.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Kondisi</InputLabel>
                <Select
                  value={kondisiFilter}
                  label="Kondisi"
                  onChange={(e) => setKondisiFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {conditions.map((condition) => (
                    <MenuItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sumber Dana</InputLabel>
                <Select
                  value={sumberDanaFilter}
                  label="Sumber Dana"
                  onChange={(e) => setSumberDanaFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {sumberDanaList.map((sumberDana) => (
                    <MenuItem key={sumberDana.id} value={sumberDana.nama}>
                      {sumberDana.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setTahunFilter('');
                  setStartDate(null);
                  setEndDate(null);
                  setKategoriFilter('');
                  setLokasiFilter('');
                  setKondisiFilter('');
                  setStatusFilter('');
                  setSumberDanaFilter('');
                }}
              >
                Reset Filter
              </Button>
            </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
          <Tab 
            icon={<InventoryIcon />} 
            iconPosition="start" 
            label="Laporan Inventaris" 
            id="report-tab-0" 
            aria-controls="report-tabpanel-0" 
          />
          <Tab 
            icon={<SwapHorizIcon />} 
            iconPosition="start" 
            label="Laporan Peminjaman" 
            id="report-tab-1" 
            aria-controls="report-tabpanel-1" 
          />
          <Tab 
            icon={<AssessmentIcon />} 
            iconPosition="start" 
            label="Laporan Kondisi" 
            id="report-tab-2" 
            aria-controls="report-tabpanel-2" 
          />

        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <DataTable
          title="Laporan Inventaris Barang"
          columns={inventoryColumns}
          rows={filteredInventoryData}
          loading={loading}
          refreshable
          onRefresh={fetchInventoryData}
          emptyMessage="Tidak ada data inventaris"
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <DataTable
          title="Laporan Peminjaman Barang"
          columns={loanColumns}
          rows={filteredLoanData}
          loading={loading}
          refreshable
          onRefresh={fetchLoanData}
          emptyMessage="Tidak ada data peminjaman"
          initialOrderBy="tanggal_pinjam"
          initialOrder="desc"
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <DataTable
          title="Laporan Kondisi Barang"
          columns={conditionColumns}
          rows={filteredConditionData}
          loading={loading}
          refreshable
          onRefresh={fetchConditionData}
          emptyMessage="Tidak ada data kondisi barang"
        />
      </TabPanel>


    </>
  );
};

export default Laporan;