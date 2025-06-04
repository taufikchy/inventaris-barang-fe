import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [lokasiFilter, setLokasiFilter] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Data states
  const [inventoryData, setInventoryData] = useState([]);
  const [loanData, setLoanData] = useState([]);
  const [conditionData, setConditionData] = useState([]);
  
  // Mock data for categories and locations
  const categories = [
    { id: 1, nama: 'Komputer' },
    { id: 2, nama: 'Periferal' },
    { id: 3, nama: 'Jaringan' },
    { id: 4, nama: 'Alat Ukur' },
    { id: 5, nama: 'Media Pembelajaran' },
  ];
  
  const locations = [
    { id: 1, nama: 'Lab Komputer 1' },
    { id: 2, nama: 'Lab Komputer 2' },
    { id: 3, nama: 'Ruang Server' },
    { id: 4, nama: 'Ruang Guru' },
    { id: 5, nama: 'Perpustakaan' },
  ];
  
  const conditions = ['Baik', 'Rusak Ringan', 'Rusak Berat'];
  const statuses = ['Dipinjam', 'Tersedia', 'Dalam Perbaikan'];

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

  const handleExport = (format) => {
    toast.info(`Mengekspor laporan dalam format ${format}...`);
    // In a real application, you would implement the export functionality here
    setTimeout(() => {
      toast.success(`Laporan berhasil diekspor dalam format ${format}`);
    }, 1500);
    handleExportClose();
  };

  // Fetch inventory report data
  const fetchInventoryData = async () => {
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
          kode: 'BRG001', 
          nama: 'Laptop Dell XPS 13', 
          kategori: 'Komputer', 
          lokasi: 'Lab Komputer 1',
          kondisi: 'Baik',
          tanggal_perolehan: '2022-01-15',
          harga: 15000000,
          status: 'Tersedia'
        },
        { 
          id: 2, 
          kode: 'BRG002', 
          nama: 'Proyektor Epson', 
          kategori: 'Media Pembelajaran', 
          lokasi: 'Lab Komputer 2',
          kondisi: 'Baik',
          tanggal_perolehan: '2021-11-20',
          harga: 7500000,
          status: 'Dipinjam'
        },
        { 
          id: 3, 
          kode: 'BRG003', 
          nama: 'Router Cisco', 
          kategori: 'Jaringan', 
          lokasi: 'Ruang Server',
          kondisi: 'Baik',
          tanggal_perolehan: '2022-03-10',
          harga: 2000000,
          status: 'Tersedia'
        },
        { 
          id: 4, 
          kode: 'BRG004', 
          nama: 'Keyboard Mechanical', 
          kategori: 'Periferal', 
          lokasi: 'Lab Komputer 1',
          kondisi: 'Rusak Ringan',
          tanggal_perolehan: '2022-02-05',
          harga: 850000,
          status: 'Dalam Perbaikan'
        },
        { 
          id: 5, 
          kode: 'BRG005', 
          nama: 'Monitor LG 24"', 
          kategori: 'Komputer', 
          lokasi: 'Lab Komputer 2',
          kondisi: 'Baik',
          tanggal_perolehan: '2022-01-25',
          harga: 2500000,
          status: 'Tersedia'
        },
      ];
      
      setInventoryData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Gagal memuat data inventaris');
      setLoading(false);
    }
  };

  // Fetch loan report data
  const fetchLoanData = async () => {
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
          kode: 'PJM001', 
          peminjam: 'Budi Santoso', 
          tanggal_pinjam: '2023-05-01', 
          tanggal_kembali: '2023-05-08',
          status: 'Dikembalikan',
          jumlah_barang: 2,
          keterangan: 'Untuk kegiatan workshop'
        },
        { 
          id: 2, 
          kode: 'PJM002', 
          peminjam: 'Ani Wijaya', 
          tanggal_pinjam: '2023-05-10', 
          tanggal_kembali: '2023-05-15',
          status: 'Dikembalikan',
          jumlah_barang: 1,
          keterangan: 'Untuk presentasi'
        },
        { 
          id: 3, 
          kode: 'PJM003', 
          peminjam: 'Citra Dewi', 
          tanggal_pinjam: '2023-05-20', 
          tanggal_kembali: null,
          status: 'Dipinjam',
          jumlah_barang: 3,
          keterangan: 'Untuk praktikum'
        },
        { 
          id: 4, 
          kode: 'PJM004', 
          peminjam: 'Deni Pratama', 
          tanggal_pinjam: '2023-05-25', 
          tanggal_kembali: null,
          status: 'Dipinjam',
          jumlah_barang: 2,
          keterangan: 'Untuk kegiatan lomba'
        },
        { 
          id: 5, 
          kode: 'PJM005', 
          peminjam: 'Eka Putri', 
          tanggal_pinjam: '2023-05-15', 
          tanggal_kembali: '2023-05-22',
          status: 'Dikembalikan',
          jumlah_barang: 1,
          keterangan: 'Untuk rapat'
        },
      ];
      
      setLoanData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast.error('Gagal memuat data peminjaman');
      setLoading(false);
    }
  };

  // Fetch condition report data
  const fetchConditionData = async () => {
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
          kode: 'BRG001', 
          nama: 'Laptop Dell XPS 13', 
          kategori: 'Komputer', 
          lokasi: 'Lab Komputer 1',
          kondisi: 'Baik',
          keterangan: 'Kondisi optimal'
        },
        { 
          id: 2, 
          kode: 'BRG002', 
          nama: 'Proyektor Epson', 
          kategori: 'Media Pembelajaran', 
          lokasi: 'Lab Komputer 2',
          kondisi: 'Baik',
          keterangan: 'Kondisi optimal'
        },
        { 
          id: 3, 
          kode: 'BRG003', 
          nama: 'Router Cisco', 
          kategori: 'Jaringan', 
          lokasi: 'Ruang Server',
          kondisi: 'Baik',
          keterangan: 'Kondisi optimal'
        },
        { 
          id: 4, 
          kode: 'BRG004', 
          nama: 'Keyboard Mechanical', 
          kategori: 'Periferal', 
          lokasi: 'Lab Komputer 1',
          kondisi: 'Rusak Ringan',
          keterangan: 'Beberapa tombol macet'
        },
        { 
          id: 5, 
          kode: 'BRG005', 
          nama: 'Monitor LG 24"', 
          kategori: 'Komputer', 
          lokasi: 'Lab Komputer 2',
          kondisi: 'Baik',
          keterangan: 'Kondisi optimal'
        },
        { 
          id: 6, 
          kode: 'BRG006', 
          nama: 'Printer HP LaserJet', 
          kategori: 'Periferal', 
          lokasi: 'Ruang Guru',
          kondisi: 'Rusak Berat',
          keterangan: 'Tidak bisa menyala'
        },
      ];
      
      setConditionData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching condition data:', error);
      toast.error('Gagal memuat data kondisi barang');
      setLoading(false);
    }
  };

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

  // Apply filters
  const filteredInventoryData = inventoryData.filter(item => {
    const dateMatch = dayjs(item.tanggal_perolehan).isAfter(startDate) && 
                      dayjs(item.tanggal_perolehan).isBefore(endDate);
    const kategoriMatch = kategoriFilter ? item.kategori === kategoriFilter : true;
    const lokasiMatch = lokasiFilter ? item.lokasi === lokasiFilter : true;
    const kondisiMatch = kondisiFilter ? item.kondisi === kondisiFilter : true;
    const statusMatch = statusFilter ? item.status === statusFilter : true;
    
    return dateMatch && kategoriMatch && lokasiMatch && kondisiMatch && statusMatch;
  });

  const filteredLoanData = loanData.filter(item => {
    const dateMatch = dayjs(item.tanggal_pinjam).isAfter(startDate) && 
                      dayjs(item.tanggal_pinjam).isBefore(endDate);
    const statusMatch = statusFilter ? item.status === statusFilter : true;
    
    return dateMatch && statusMatch;
  });

  const filteredConditionData = conditionData.filter(item => {
    const kategoriMatch = kategoriFilter ? item.kategori === kategoriFilter : true;
    const lokasiMatch = lokasiFilter ? item.lokasi === lokasiFilter : true;
    const kondisiMatch = kondisiFilter ? item.kondisi === kondisiFilter : true;
    
    return kategoriMatch && lokasiMatch && kondisiMatch;
  });

  // Table columns definition
  const inventoryColumns = [
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'nama', label: 'Nama Barang', sortable: true },
    { id: 'kategori', label: 'Kategori', sortable: true },
    { id: 'lokasi', label: 'Lokasi', sortable: true },
    { id: 'kondisi', label: 'Kondisi', sortable: true },
    { id: 'tanggal_perolehan', label: 'Tanggal Perolehan', sortable: true },
    { id: 'harga', label: 'Harga (Rp)', sortable: true, format: (value) => value.toLocaleString('id-ID') },
    { id: 'status', label: 'Status', sortable: true },
  ];

  const loanColumns = [
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'peminjam', label: 'Peminjam', sortable: true },
    { id: 'tanggal_pinjam', label: 'Tanggal Pinjam', sortable: true },
    { id: 'tanggal_kembali', label: 'Tanggal Kembali', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'jumlah_barang', label: 'Jumlah Barang', sortable: true },
    { id: 'keterangan', label: 'Keterangan', sortable: true },
  ];

  const conditionColumns = [
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'nama', label: 'Nama Barang', sortable: true },
    { id: 'kategori', label: 'Kategori', sortable: true },
    { id: 'lokasi', label: 'Lokasi', sortable: true },
    { id: 'kondisi', label: 'Kondisi', sortable: true },
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
        <MenuItem onClick={() => handleExport('PDF')}>
          <PdfIcon sx={{ mr: 1 }} /> Ekspor PDF
        </MenuItem>
        <MenuItem onClick={() => handleExport('Excel')}>
          <ExcelIcon sx={{ mr: 1 }} /> Ekspor Excel
        </MenuItem>
        <MenuItem onClick={() => handleExport('Print')}>
          <PrintIcon sx={{ mr: 1 }} /> Cetak
        </MenuItem>
      </Menu>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter Laporan
          </Typography>
          <Grid container spacing={2}>
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
                    <MenuItem key={condition} value={condition}>
                      {condition}
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
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setStartDate(dayjs().subtract(30, 'day'));
                  setEndDate(dayjs());
                  setKategoriFilter('');
                  setLokasiFilter('');
                  setKondisiFilter('');
                  setStatusFilter('');
                }}
              >
                Reset Filter
              </Button>
            </Grid>
          </Grid>
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