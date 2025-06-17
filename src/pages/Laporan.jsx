import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axios';
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
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import PDFGenerator from '../components/PDFGenerator';

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
  const [jenisTransaksiFilter, setJenisTransaksiFilter] = useState('');
  
  // Data states
  const [inventoryData, setInventoryData] = useState([]);
  const [loanData, setLoanData] = useState([]);
  const [conditionData, setConditionData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  
  // Filter dropdown data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);

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

  const handleExport = async (format) => {
    if (format === 'PDF') {
      try {
        toast.info('Mengekspor laporan dalam format PDF...');
        
        const pdfGenerator = new PDFGenerator();
        await pdfGenerator.loadLogo();
        const doc = pdfGenerator.initDocument();
        
        let currentY = pdfGenerator.margins.top;
        
        // Tambahkan kop surat
        currentY = pdfGenerator.addHeader(currentY);
        
        // Judul laporan
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        
        let reportTitle = '';
        let reportData = [];
        let columns = [];
        
        // Tentukan data berdasarkan tab aktif
        switch (activeTab) {
          case 0: // Laporan Inventaris
            reportTitle = 'LAPORAN INVENTARIS BARANG';
            reportData = inventoryData;
            columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Kode Barang', dataKey: 'kode' },
              { header: 'Nama Barang', dataKey: 'nama' },
              { header: 'Kategori', dataKey: 'kategori' },
              { header: 'Lokasi', dataKey: 'lokasi' },
              { header: 'Kondisi', dataKey: 'kondisi' },
              { header: 'Status', dataKey: 'status' },
              { header: 'Jumlah', dataKey: 'jumlah' },
              { header: 'Tahun Pengadaan', dataKey: 'tahun_pengadaan' },
              { header: 'Tanggal Pencatatan', dataKey: 'tanggal_perolehan' }
            ];
            break;
          case 1: // Laporan Peminjaman
            reportTitle = 'LAPORAN PEMINJAMAN BARANG';
            reportData = loanData;
            columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Kode Peminjaman', dataKey: 'kode_peminjaman' },
              { header: 'Peminjam', dataKey: 'nama_peminjam' },
              { header: 'Barang', dataKey: 'nama_barang' },
              { header: 'Jumlah', dataKey: 'jumlah_dipinjam' },
              { header: 'Tanggal Pinjam', dataKey: 'tanggal_pinjam' },
              { header: 'Tanggal Kembali', dataKey: 'tanggal_kembali' },
              { header: 'Status', dataKey: 'status' }
            ];
            break;
          case 2: // Laporan Kondisi
            reportTitle = 'LAPORAN KONDISI BARANG';
            reportData = conditionData;
            columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Kode Barang', dataKey: 'kode' },
              { header: 'Nama Barang', dataKey: 'nama' },
              { header: 'Kondisi', dataKey: 'kondisi' },
              { header: 'Jumlah', dataKey: 'jumlah' },
              { header: 'Keterangan', dataKey: 'keterangan' }
            ];
            break;
          case 3: // Laporan Transaksi
            reportTitle = 'LAPORAN TRANSAKSI BARANG';
            reportData = transactionData;
            columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Tanggal', dataKey: 'tanggal' },
              { header: 'Jenis Transaksi', dataKey: 'jenis_transaksi' },
              { header: 'Kode Barang', dataKey: 'kode_barang' },
              { header: 'Nama Barang', dataKey: 'nama_barang' },
              { header: 'Jumlah', dataKey: 'jumlah' },
              { header: 'Keterangan', dataKey: 'keterangan' }
            ];
            break;
        }
        
        // Tambahkan judul laporan
        doc.text(reportTitle, pdfGenerator.pageWidth / 2, currentY + 10, { align: 'center' });
        currentY += 20;
        
        // Tambahkan periode laporan
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        const periode = `Periode: ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
        doc.text(periode, pdfGenerator.pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;
        
        // Siapkan data untuk tabel dengan nomor urut
        const tableData = reportData.map((item, index) => ({
          ...item,
          no: index + 1
        }));
        
        // Tambahkan tabel
        doc.autoTable({
          startY: currentY,
          head: [columns.map(col => col.header)],
          body: tableData.map(row => columns.map(col => row[col.dataKey] || '-')),
          styles: {
            font: 'times',
            fontSize: 9,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: pdfGenerator.margins.left, right: pdfGenerator.margins.right }
        });
        
        // Tambahkan footer dengan tanggal cetak
        const finalY = doc.lastAutoTable.finalY || currentY + 50;
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(
          `Dicetak pada: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`,
          pdfGenerator.margins.left,
          pdfGenerator.pageHeight - 15
        );
        
        // Simpan PDF
        const fileName = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.pdf`;
        doc.save(fileName);
        
        toast.success('Laporan berhasil diekspor dalam format PDF');
      } catch (error) {
        console.error('Error exporting PDF:', error);
        toast.error('Gagal mengekspor laporan PDF');
      }
    } else if (format === 'Print') {
      toast.info('Membuka dialog cetak...');
      window.print();
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
      // Set static conditions based on backend enum values
      setConditions([
        { value: 'baik', label: 'Baik' },
        { value: 'rusak_ringan', label: 'Rusak Ringan' },
        { value: 'rusak_berat', label: 'Rusak Berat' }
      ]);
    } catch (error) {
      console.error('Error setting conditions:', error);
    }
  };

  // Fetch statuses for filter dropdown
  const fetchStatuses = async () => {
    try {
      // Set static statuses based on backend enum values
      setStatuses([
        { value: 'tersedia', label: 'Tersedia' },
        { value: 'dipinjam', label: 'Dipinjam' },
        { value: 'dalam_perbaikan', label: 'Dalam Perbaikan' }
      ]);
    } catch (error) {
      console.error('Error setting statuses:', error);
    }
  };

  // Fetch transaction types for filter dropdown
  const fetchTransactionTypes = async () => {
    try {
      // Set static transaction types based on backend enum values
      setTransactionTypes([
        { value: 'masuk', label: 'Masuk' },
        { value: 'keluar', label: 'Keluar' },
        { value: 'rusak', label: 'Rusak' },
        { value: 'hilang', label: 'Hilang' }
      ]);
    } catch (error) {
      console.error('Error setting transaction types:', error);
    }
  };

  // Fetch inventory report data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/laporan/inventaris', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setInventoryData(response.data.data.inventaris);
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
      const response = await axios.get('/api/laporan/peminjaman', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.sukses) {
        setLoanData(response.data.data.peminjaman);
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
      const response = await axios.get('/api/laporan/kondisi', {
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

  // Fetch transaction report data
  const fetchTransactionData = async () => {
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
          kode: 'TRX001', 
          barang: 'Laptop Dell XPS 13', 
          jenis_transaksi: 'masuk',
          jumlah: 5,
          tanggal_transaksi: '2023-05-01',
          harga_satuan: 15000000,
          total_harga: 75000000,
          supplier: 'PT. Tech Solutions',
          keterangan: 'Pembelian laptop baru'
        },
        { 
          id: 2, 
          kode: 'TRX002', 
          barang: 'Mouse Wireless', 
          jenis_transaksi: 'keluar',
          jumlah: 2,
          tanggal_transaksi: '2023-05-05',
          harga_satuan: 150000,
          total_harga: 300000,
          supplier: '-',
          keterangan: 'Distribusi ke lab'
        },
        { 
          id: 3, 
          kode: 'TRX003', 
          barang: 'Keyboard Mechanical', 
          jenis_transaksi: 'rusak',
          jumlah: 1,
          tanggal_transaksi: '2023-05-10',
          harga_satuan: 850000,
          total_harga: 850000,
          supplier: '-',
          keterangan: 'Kerusakan akibat tumpahan air'
        },
        { 
          id: 4, 
          kode: 'TRX004', 
          barang: 'Monitor LG 24"', 
          jenis_transaksi: 'hilang',
          jumlah: 1,
          tanggal_transaksi: '2023-05-15',
          harga_satuan: 2500000,
          total_harga: 2500000,
          supplier: '-',
          keterangan: 'Hilang dari ruang penyimpanan'
        },
        { 
          id: 5, 
          kode: 'TRX005', 
          barang: 'Proyektor Epson', 
          jenis_transaksi: 'masuk',
          jumlah: 3,
          tanggal_transaksi: '2023-05-20',
          harga_satuan: 7500000,
          total_harga: 22500000,
          supplier: 'CV. Media Edukasi',
          keterangan: 'Pengadaan proyektor untuk lab'
        },
      ];
      
      setTransactionData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      toast.error('Gagal memuat data transaksi');
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
    fetchTransactionTypes();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 0) {
      fetchInventoryData();
    } else if (activeTab === 1) {
      fetchLoanData();
    } else if (activeTab === 2) {
      fetchConditionData();
    } else if (activeTab === 3) {
      fetchTransactionData();
    }
  }, [activeTab]);

  // Note: Removed auto-refetch on filter change to prevent data flickering
  // Filters are now applied client-side for better performance

  // Apply filters
  const filteredInventoryData = inventoryData.filter(item => {
    const itemDate = dayjs(item.tanggal_perolehan);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const kategoriMatch = !kategoriFilter || (item.kategori?.nama || item.kategori) === kategoriFilter;
    const lokasiMatch = !lokasiFilter || (item.lokasi?.nama || item.lokasi) === lokasiFilter;
    const kondisiMatch = !kondisiFilter || item.kondisi === kondisiFilter;
    const statusMatch = !statusFilter || item.status === statusFilter;
    
    return dateMatch && kategoriMatch && lokasiMatch && kondisiMatch && statusMatch;
  });

  const filteredLoanData = loanData.filter(item => {
    const itemDate = dayjs(item.tanggal_pinjam);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const statusMatch = !statusFilter || item.status === statusFilter;
    
    return dateMatch && statusMatch;
  });

  const filteredConditionData = conditionData.filter(item => {
    const kategoriMatch = !kategoriFilter || (item.kategori?.nama || item.kategori) === kategoriFilter;
    const lokasiMatch = !lokasiFilter || (item.lokasi?.nama || item.lokasi) === lokasiFilter;
    const kondisiMatch = !kondisiFilter || item.kondisi === kondisiFilter;
    
    return kategoriMatch && lokasiMatch && kondisiMatch;
  });

  const filteredTransactionData = transactionData.filter(item => {
    const itemDate = dayjs(item.tanggal_transaksi);
    const dateMatch = (!startDate || !endDate) ? true : itemDate.isBetween(startDate, endDate, 'day', '[]');
    const jenisMatch = !jenisTransaksiFilter || item.jenis_transaksi === jenisTransaksiFilter;
    
    return dateMatch && jenisMatch;
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
    { id: 'status', label: 'Status', sortable: true, format: (value) => {
      const statusLabels = {
        'tersedia': 'Tersedia',
        'dipinjam': 'Dipinjam',
        'dalam_perbaikan': 'Dalam Perbaikan'
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
        if (row.detail_peminjaman && row.detail_peminjaman.length > 0) {
          const catatan = row.detail_peminjaman.map(detail => detail.catatan).filter(c => c).join(', ');
          return catatan || '-';
        }
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

  const transactionColumns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
    { id: 'kode', label: 'Kode', sortable: true },
    { id: 'barang', label: 'Nama Barang', sortable: true },
    { id: 'jenis_transaksi', label: 'Jenis', sortable: true, format: (value) => {
      const labels = {
        'masuk': 'Masuk',
        'keluar': 'Keluar', 
        'rusak': 'Rusak',
        'hilang': 'Hilang'
      };
      return labels[value] || value;
    }},
    { id: 'jumlah', label: 'Jumlah', sortable: true },
    { id: 'tanggal_transaksi', label: 'Tanggal', sortable: true, format: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }},
    { id: 'harga_satuan', label: 'Harga Satuan', sortable: true, format: (value) => 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)
    },
    { id: 'total_harga', label: 'Total Harga', sortable: true, format: (value) => 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)
    },
    { id: 'supplier', label: 'Supplier', sortable: true },
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
                <InputLabel>Jenis Transaksi</InputLabel>
                <Select
                  value={jenisTransaksiFilter}
                  label="Jenis Transaksi"
                  onChange={(e) => setJenisTransaksiFilter(e.target.value)}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {transactionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
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
                  setStartDate(dayjs().subtract(30, 'day'));
                  setEndDate(dayjs());
                  setKategoriFilter('');
                  setLokasiFilter('');
                  setKondisiFilter('');
                  setStatusFilter('');
                  setJenisTransaksiFilter('');
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
          <Tab 
            icon={<ReceiptIcon />} 
            iconPosition="start" 
            label="Laporan Transaksi" 
            id="report-tab-3" 
            aria-controls="report-tabpanel-3" 
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

      <TabPanel value={activeTab} index={3}>
        <DataTable
          title="Laporan Transaksi Barang"
          columns={transactionColumns}
          rows={filteredTransactionData}
          loading={loading}
          refreshable
          onRefresh={fetchTransactionData}
          emptyMessage="Tidak ada data transaksi"
        />
      </TabPanel>
    </>
  );
};

export default Laporan;