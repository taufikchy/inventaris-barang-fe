import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import ApprovalDialog from '../components/ApprovalDialog';
import ReturnDialog from '../components/ReturnDialog';
import PrintBorrowingLetter from '../components/PrintBorrowingLetter';
import PDFGenerator from '../components/PDFGenerator';

// Validation schema for peminjaman form
const PeminjamanSchema = Yup.object().shape({
  peminjam: Yup.string().required('Nama peminjam wajib diisi'),
  kontak: Yup.string().required('Kontak peminjam wajib diisi'),
  kelas: Yup.string().required('Instansi peminjam wajib diisi'),
  jabatan: Yup.string(),
  tanggal_pinjam: Yup.date().required('Tanggal pinjam wajib diisi'),
  tanggal_kembali_harapan: Yup.date().required('Tanggal rencana kembali wajib diisi'),
  keterangan: Yup.string(),
  detail_peminjaman: Yup.array().of(
    Yup.object().shape({
      id_barang: Yup.number().required('Barang wajib dipilih'),
      jumlah: Yup.number()
        .required('Jumlah wajib diisi')
        .min(1, 'Jumlah minimal 1')
        .integer('Jumlah harus berupa bilangan bulat'),
    })
  ).min(1, 'Minimal 1 barang harus dipilih'),
});

const PeminjamanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isKepalaLab, isAdminOrToolman, isAdminToolmanOrKepalaLab } = useAuth(); // Mendapatkan informasi pengguna yang login
  const isNewPeminjaman = id === 'new';
  const isEditMode = location.pathname.includes('/edit') || isNewPeminjaman;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [peminjaman, setPeminjaman] = useState(null);
  const [barangs, setBarangs] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [lokasis, setLokasis] = useState([]);
  const [filterKategori, setFilterKategori] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [barangDialogOpen, setBarangDialogOpen] = useState(false);
  const [selectedBarangIndex, setSelectedBarangIndex] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const printRef = useRef();

  // Get kondisi chip color
  const getKondisiColor = (kondisi) => {
    // Normalize kondisi to handle both database format and display format
    const normalizedKondisi = kondisi?.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedKondisi) {
      case 'baik':
        return 'success';
      case 'rusak_ringan':
        return 'warning';
      case 'rusak_berat':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format kondisi label for display
  const formatKondisiLabel = (kondisi) => {
    if (!kondisi) return '-';
    const normalizedKondisi = kondisi.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedKondisi) {
      case 'baik':
        return 'Baik';
      case 'rusak_ringan':
        return 'Rusak Ringan';
      case 'rusak_berat':
        return 'Rusak Berat';
      default:
        return kondisi;
    }
  };

  // Handle PDF generation
  const handlePrintPDF = async () => {
    try {
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generateBorrowingLetter(peminjaman);
      pdfGenerator.savePDF(peminjaman);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF. Silakan coba lagi.');
    }
  };

  // Handle PDF preview
  const handlePreviewPDF = async () => {
    try {
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generateBorrowingLetter(peminjaman);
      pdfGenerator.previewPDF(peminjaman);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Gagal membuat preview PDF. Silakan coba lagi.');
    }
  };

  // Fetch peminjaman data
  const fetchPeminjaman = async () => {
    if (isNewPeminjaman) {
      // Check if user is logged in
      if (!user) {
        toast.error('Anda harus login untuk membuat peminjaman baru');
        navigate('/login');
        return;
      }
      
      // Initialize new peminjaman
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      setPeminjaman({
        kode: 'PJM-NEW', // Temporary code for new peminjaman
        peminjam: '',
        kontak: '',
        kelas: '',
        jabatan: '',
        tanggal_pinjam: today.toISOString().split('T')[0],
        tanggal_kembali_harapan: tomorrow.toISOString().split('T')[0],
        keterangan: '',
        detail_peminjaman: [],
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch data from API
      const response = await axios.get(`/api/peminjaman/${id}`);
      
      if (response.data.sukses) {
        const peminjamanData = response.data.data;
        // Generate kode peminjaman dari ID jika belum ada
        if (!peminjamanData.kode) {
          peminjamanData.kode = `PJM-${peminjamanData.id.toString().padStart(3, '0')}`;
        }
        
        // Helper function to format date for HTML date input
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        // Map backend fields to frontend expected fields
        const mappedData = {
          ...peminjamanData,
          peminjam: peminjamanData.nama_peminjam,
          kontak: peminjamanData.kontak_peminjam,
          kelas: peminjamanData.kelas_peminjam,
          tanggal_pinjam: formatDateForInput(peminjamanData.tanggal_pinjam),
          tanggal_kembali_harapan: formatDateForInput(peminjamanData.tanggal_kembali_harapan),
          tanggal_kembali: formatDateForInput(peminjamanData.tanggal_kembali_aktual || peminjamanData.tanggal_kembali_harapan),
          keterangan: peminjamanData.catatan,
          detail_peminjaman: peminjamanData.detail_peminjaman?.map(item => ({
            ...item,
            kode_barang: item.barang?.kode || '',
            nama_barang: item.barang?.nama || '',
            kondisi_saat_pinjam: item.kondisi_saat_pinjam || item.kondisi_sebelum || 'baik',
            kondisi_pinjam: item.kondisi_saat_pinjam || item.kondisi_sebelum || 'baik',
            lokasi_ruangan: item.barang?.lokasi?.nama || '-'
          })) || []
        };
        
        setPeminjaman(mappedData);
      } else {
        toast.error('Gagal memuat data peminjaman: ' + response.data.pesan);
        navigate('/peminjaman');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
      toast.error('Gagal memuat data peminjaman: ' + (error.response?.data?.pesan || error.message));
      navigate('/peminjaman');
      setLoading(false);
    }
  };

  // Fetch barang data
  const fetchBarangs = async () => {
    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      params.append('tersedia', 'true');
      if (filterKategori) params.append('kategori', filterKategori);
      if (filterLokasi) params.append('lokasi', filterLokasi);
      if (filterKondisi) params.append('kondisi', filterKondisi);
      
      // Fetch data from API
      const response = await axios.get(`/api/barang/dropdown?${params.toString()}`);
      
      if (response.data.sukses) {
        setBarangs(response.data.data);
      } else {
        toast.error('Gagal memuat data barang: ' + response.data.pesan);
        setBarangs([]);
      }
    } catch (error) {
      console.error('Error fetching barangs:', error);
      toast.error('Gagal memuat data barang: ' + (error.response?.data?.pesan || error.message));
      setBarangs([]);
    }
  };

  // Fetch kategori data
  const fetchKategoris = async () => {
    try {
      const response = await axios.get('/api/kategori/dropdown');
      if (response.data.sukses) {
        setKategoris(response.data.data);
      } else {
        toast.error('Gagal memuat data kategori: ' + response.data.pesan);
        setKategoris([]);
      }
    } catch (error) {
      console.error('Error fetching kategoris:', error);
      toast.error('Gagal memuat data kategori: ' + (error.response?.data?.pesan || error.message));
      setKategoris([]);
    }
  };

  // Fetch lokasi data
  const fetchLokasis = async () => {
    try {
      const response = await axios.get('/api/lokasi/dropdown');
      if (response.data.sukses) {
        setLokasis(response.data.data);
      } else {
        toast.error('Gagal memuat data lokasi: ' + response.data.pesan);
        setLokasis([]);
      }
    } catch (error) {
      console.error('Error fetching lokasis:', error);
      toast.error('Gagal memuat data lokasi: ' + (error.response?.data?.pesan || error.message));
      setLokasis([]);
    }
  };
  useEffect(() => {
    // Check if user is logged in
    if (isNewPeminjaman && !user) {
      toast.error('Anda harus login untuk membuat peminjaman baru');
      navigate('/login');
      return;
    }
    
    // Check if sarana role is trying to access edit mode or create new peminjaman
    if (user && user.peran === 'sarana' && (isEditMode || isNewPeminjaman)) {
      toast.error('Anda tidak memiliki akses untuk mengedit atau membuat peminjaman baru');
      navigate('/peminjaman');
      return;
    }
    
    fetchPeminjaman();
    fetchBarangs();
    fetchKategoris();
    fetchLokasis();
  }, [id, user, isEditMode, isNewPeminjaman]);

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === 'kategori') {
      setFilterKategori(value);
    } else if (name === 'lokasi') {
      setFilterLokasi(value);
    } else if (name === 'kondisi') {
      setFilterKondisi(value);
    }
  };

  // Effect untuk memanggil fetchBarangs ketika filter berubah
  useEffect(() => {
    fetchBarangs();
  }, [filterKategori, filterLokasi, filterKondisi]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSaving(true);
      
      // Format data sesuai dengan yang diharapkan oleh backend
      const formattedValues = {
        nama_peminjam: values.peminjam,
        kontak_peminjam: values.kontak || '',
        kelas_peminjam: values.kelas || '',
        jabatan_peminjam: values.jabatan || '',
        tanggal_pinjam: values.tanggal_pinjam,
        tanggal_kembali_harapan: values.tanggal_kembali_harapan,
        catatan: values.keterangan || '',
        id_pengguna: user?.id, // Menambahkan id_pengguna dari user yang login
        detail_peminjaman: values.detail_peminjaman.map(item => ({
          id_barang: item.id_barang,
          jumlah: parseInt(item.jumlah, 10),
          kondisi_saat_pinjam: item.kondisi_saat_pinjam || 'baik'
        }))
      };
      
      console.log('Sending data to backend:', formattedValues);
      
      let response;
      
      if (isNewPeminjaman) {
        // Create new peminjaman
        response = await axios.post('/api/peminjaman', formattedValues);
      } else {
        // Update existing peminjaman
        response = await axios.put(`/api/peminjaman/${id}`, formattedValues);
      }
      
      if (response.data.sukses) {
        toast.success(isNewPeminjaman ? 'Peminjaman berhasil ditambahkan' : 'Peminjaman berhasil diperbarui');
        
        // Redirect to peminjaman list after successful save
        navigate('/peminjaman');
      } else {
        toast.error((isNewPeminjaman ? 'Gagal menambahkan peminjaman: ' : 'Gagal memperbarui peminjaman: ') + response.data.pesan);
      }
    } catch (error) {
      console.error('Error saving peminjaman:', error);
      console.error('Error response:', error.response?.data);
      toast.error((isNewPeminjaman ? 'Gagal menambahkan peminjaman: ' : 'Gagal memperbarui peminjaman: ') + (error.response?.data?.pesan || error.message));
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      // Send delete request to API
      const response = await axios.delete(`/api/peminjaman/${id}`);
      
      if (response.data.sukses) {
        toast.success('Peminjaman berhasil dihapus');
        navigate('/peminjaman');
      } else {
        toast.error('Gagal menghapus peminjaman: ' + response.data.pesan);
        setConfirmDelete(false);
      }
    } catch (error) {
      console.error('Error deleting peminjaman:', error);
      toast.error('Gagal menghapus peminjaman: ' + (error.response?.data?.pesan || error.message));
      setConfirmDelete(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle return
  const handleReturn = async (returnData) => {
    try {
      setReturnLoading(true);
      const response = await axios.put(`/api/peminjaman/${id}/kembalikan`, {
        kondisi_barang: returnData.kondisi_barang,
        catatan: returnData.catatan,
        detail_kondisi: returnData.detail_kondisi
      });
      if (response.data.sukses) {
        toast.success('Barang berhasil dikembalikan!');
        fetchPeminjaman();
        setConfirmReturn(false);
      } else {
        toast.error('Gagal mengembalikan barang: ' + response.data.pesan);
      }
    } catch (error) {
      console.error('Error returning items:', error);
      toast.error('Gagal mengembalikan barang: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setReturnLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'menunggu_persetujuan':
        return 'warning';
      case 'disetujui':
        return 'info';
      case 'ditolak':
        return 'error';
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

  // Handle approval
  const handleApproval = async (approvalData) => {
    try {
      setApprovalLoading(true);
      const response = await axios.put(`/api/peminjaman/${id}/persetujuan`, approvalData);
      if (response.data.sukses) {
        toast.success('Persetujuan berhasil diproses!');
        fetchPeminjaman();
        setApprovalDialogOpen(false);
      } else {
        toast.error('Gagal memproses persetujuan: ' + response.data.pesan);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Gagal memproses persetujuan: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setApprovalLoading(false);
    }
  };

  // Handle upload surat
  const handleUploadSurat = async (file) => {
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('surat_peminjaman', file);
      
      const response = await axios.post(`/api/peminjaman/${id}/upload-surat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.sukses) {
        toast.success('Surat peminjaman berhasil diunggah!');
        fetchPeminjaman();
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setFileError('');
      } else {
        toast.error('Gagal mengunggah surat: ' + response.data.pesan);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Gagal mengunggah surat: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setUploadLoading(false);
    }
  };

  // Open barang dialog
  const openBarangDialog = (index = null) => {
    setSelectedBarangIndex(index);
    setBarangDialogOpen(true);
  };

  // Close barang dialog
  const closeBarangDialog = () => {
    setBarangDialogOpen(false);
    setSelectedBarangIndex(null);
  };

  // Convert kondisi from display format to database format
  const convertKondisiToDatabase = (kondisi) => {
    if (!kondisi) return 'baik';
    const normalizedKondisi = kondisi.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedKondisi) {
      case 'baik':
        return 'baik';
      case 'rusak_ringan':
        return 'rusak_ringan';
      case 'rusak_berat':
        return 'rusak_berat';
      default:
        // If it's already in database format, return as is
        if (['baik', 'rusak_ringan', 'rusak_berat'].includes(kondisi)) {
          return kondisi;
        }
        return 'baik'; // Default fallback
    }
  };

  // Add or update barang to peminjaman
  const addOrUpdateBarang = (formikProps, barang, jumlah) => {
    const { values, setFieldValue } = formikProps;
    
    if (selectedBarangIndex !== null) {
      // Update existing barang
      const updatedDetailPeminjaman = [...values.detail_peminjaman];
      updatedDetailPeminjaman[selectedBarangIndex] = {
          id_barang: barang.id,
          nama_barang: barang.nama,
          kode_barang: barang.kode,
          jumlah: parseInt(jumlah),
          kondisi_saat_pinjam: convertKondisiToDatabase(barang.kondisi),
          lokasi_ruangan: barang.lokasi?.nama || '-'
        };
      setFieldValue('detail_peminjaman', updatedDetailPeminjaman);
    } else {
      // Check if barang already exists in the list
      const currentDetailPeminjaman = Array.isArray(values.detail_peminjaman) ? values.detail_peminjaman : [];
      const existingBarang = currentDetailPeminjaman.find(item => item.id_barang === barang.id);
      
      if (existingBarang) {
        toast.error(`Barang "${barang.nama}" sudah ada dalam daftar peminjaman. Silakan edit jumlah jika diperlukan.`);
        closeBarangDialog();
        return;
      }
      
      // Add new barang
      const newBarang = {
        id_barang: barang.id,
        nama_barang: barang.nama,
        kode_barang: barang.kode,
        jumlah: parseInt(jumlah),
        kondisi_saat_pinjam: convertKondisiToDatabase(barang.kondisi),
        lokasi_ruangan: barang.lokasi?.nama || '-',
      };
      setFieldValue('detail_peminjaman', [...currentDetailPeminjaman, newBarang]);
    }
    
    closeBarangDialog();
  };

  // Remove barang from peminjaman
  const removeBarang = (formikProps, index) => {
    const { values, setFieldValue } = formikProps;
    const updatedDetailPeminjaman = [...values.detail_peminjaman];
    updatedDetailPeminjaman.splice(index, 1);
    setFieldValue('detail_peminjaman', updatedDetailPeminjaman);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={isNewPeminjaman ? 'Tambah Peminjaman Baru' : 'Detail Peminjaman'}
        backButton
        onBackClick={() => navigate('/peminjaman')}
        actionButton={!isNewPeminjaman && !isEditMode && peminjaman.status === 'dipinjam' && isAdminToolmanOrKepalaLab() ? {
          icon: <CheckCircleIcon />,
          text: 'Kembalikan',
          onClick: () => setConfirmReturn(true),
          color: 'success',
        } : null}
      />

      {isEditMode ? (
        <Formik
          initialValues={{
            peminjam: peminjaman.peminjam,
            kontak: peminjaman.kontak || '',
            kelas: peminjaman.kelas || '',
            jabatan: peminjaman.jabatan || '',
            tanggal_pinjam: peminjaman.tanggal_pinjam,
            tanggal_kembali_harapan: peminjaman.tanggal_kembali_harapan || '',
            keterangan: peminjaman.keterangan || '',
            detail_peminjaman: peminjaman.detail_peminjaman || [],
          }}
          validationSchema={PeminjamanSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values, handleChange, setFieldValue }) => (
            <Form>
              <Paper sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: { xs: 2, sm: 3 } 
              }}>
                <Typography variant="h6" gutterBottom sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}>
                  Informasi Peminjaman
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kode Peminjaman"
                      value={peminjaman.kode}
                      disabled
                      size="small"
                      margin="normal"
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="peminjam"
                      name="peminjam"
                      label="Nama Peminjam"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      error={touched.peminjam && Boolean(errors.peminjam)}
                      helperText={touched.peminjam && errors.peminjam}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="kontak"
                      name="kontak"
                      label="Kontak Peminjam"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      error={touched.kontak && Boolean(errors.kontak)}
                      helperText={touched.kontak && errors.kontak}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="kelas"
                      name="kelas"
                      label="Instansi Peminjam"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      error={touched.kelas && Boolean(errors.kelas)}
                      helperText={touched.kelas && errors.kelas}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="jabatan"
                      name="jabatan"
                      label="Jabatan Peminjam"
                      fullWidth
                      size="small"
                      margin="normal"
                      error={touched.jabatan && Boolean(errors.jabatan)}
                      helperText={touched.jabatan && errors.jabatan}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="tanggal_pinjam"
                      name="tanggal_pinjam"
                      label="Tanggal Pinjam"
                      type="date"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      error={touched.tanggal_pinjam && Boolean(errors.tanggal_pinjam)}
                      helperText={touched.tanggal_pinjam && errors.tanggal_pinjam}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      id="tanggal_kembali_harapan"
                      name="tanggal_kembali_harapan"
                      label="Tanggal Rencana Kembali"
                      type="date"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      error={touched.tanggal_kembali_harapan && Boolean(errors.tanggal_kembali_harapan)}
                      helperText={touched.tanggal_kembali_harapan && errors.tanggal_kembali_harapan}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      id="keterangan"
                      name="keterangan"
                      label="Keterangan"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      margin="normal"
                      error={touched.keterangan && Boolean(errors.keterangan)}
                      helperText={touched.keterangan && errors.keterangan}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Typography variant="h6" sx={{
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}>
                    Barang yang Dipinjam
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                    onClick={() => openBarangDialog()}
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      padding: { xs: '4px 8px', sm: '6px 16px' }
                    }}
                  >
                    Tambah Barang
                  </Button>
                </Box>

                <FieldArray name="detail_peminjaman">
                  {() => (
                    <>
                      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                        <Table
                          sx={{ 
                            width: '100%',
                            tableLayout: 'auto',
                            minWidth: '650px'
                          }}
                          size="medium"
                        >
                          <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: 'var(--primary-color)', color: 'white' } }}>
                              <TableCell sx={{ 
                                fontWeight: 600, 
                                minWidth: '80px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Kode</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 600, 
                                minWidth: '200px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Nama Barang</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 600, 
                                minWidth: '120px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Lokasi Ruangan</TableCell>
                              <TableCell align="center" sx={{ 
                                fontWeight: 600, 
                                minWidth: '70px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Jumlah</TableCell>
                              <TableCell sx={{ 
                                fontWeight: 600, 
                                minWidth: '100px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Kondisi</TableCell>
                              <TableCell align="center" sx={{ 
                                fontWeight: 600, 
                                minWidth: '80px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'white',
                                padding: { xs: '8px 4px', sm: '12px 8px' },
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}>Aksi</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {values.detail_peminjaman.length > 0 ? (
                              values.detail_peminjaman.map((item, index) => (
                                <TableRow key={index} sx={{ 
                                  '&:nth-of-type(odd)': { backgroundColor: '#f0f0f0' },
                                  '&:hover': { backgroundColor: '#e8f5e9 !important' }
                                }}>
                                  <TableCell align="center" sx={{ 
                                    padding: { xs: '8px 4px', sm: '12px 8px' },
                                    minWidth: '80px'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 500,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: 1.3,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {item.kode_barang}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ 
                                    padding: { xs: '8px 4px', sm: '12px 8px' },
                                    minWidth: '200px'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 500,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: 1.4,
                                      wordBreak: 'break-word'
                                    }}>
                                      {item.nama_barang}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center" sx={{ 
                                    padding: { xs: '8px 4px', sm: '12px 8px' },
                                    minWidth: '120px'
                                  }}>
                                    <Typography variant="body2" sx={{
                                      color: item.lokasi_ruangan ? 'text.primary' : 'text.secondary',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: 1.3,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {item.lokasi_ruangan || '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center" sx={{ 
                                    padding: { xs: '8px 4px', sm: '12px 8px' },
                                    minWidth: '70px'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 500,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: 1.3,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {item.jumlah}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center" sx={{ 
                                    padding: { xs: '8px 4px', sm: '12px 8px' },
                                    minWidth: '100px'
                                  }}>
                                    <Chip
                                      label={formatKondisiLabel(item.kondisi_saat_pinjam)}
                                      size="small"
                                      color={getKondisiColor(item.kondisi_saat_pinjam)}
                                      sx={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                        height: { xs: '20px', sm: '24px' }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={{ padding: { xs: '8px 4px', sm: '12px 8px' } }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => openBarangDialog(index)}
                                      color="primary"
                                      sx={{ 
                                        mr: { xs: 0.25, sm: 0.5 },
                                        padding: { xs: '2px', sm: '4px' }
                                      }}
                                    >
                                      <EditIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => removeBarang({ values, setFieldValue }, index)}
                                      color="error"
                                      sx={{ padding: { xs: '2px', sm: '4px' } }}
                                    >
                                      <RemoveIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  Belum ada barang yang dipilih
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </FieldArray>
                {errors.detail_peminjaman && typeof errors.detail_peminjaman === 'string' && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {errors.detail_peminjaman}
                  </Typography>
                )}

                <Box sx={{ 
                  mt: { xs: 2, sm: 3 }, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => isNewPeminjaman ? navigate('/peminjaman') : navigate(`/peminjaman/${id}`)}
                    startIcon={<CancelIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      padding: { xs: '6px 12px', sm: '8px 16px' }
                    }}
                  >
                    Batal
                  </Button>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    {!isNewPeminjaman && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setConfirmDelete(true)}
                        startIcon={<DeleteIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                        size="small"
                        sx={{ 
                          mr: { xs: 0, sm: 1 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          padding: { xs: '6px 12px', sm: '8px 16px' }
                        }}
                      >
                        Hapus
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
                      size="small"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        padding: { xs: '6px 12px', sm: '8px 16px' }
                      }}
                    >
                      {isNewPeminjaman ? 'Tambah' : 'Simpan'}
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Barang Dialog */}
              <Dialog open={barangDialogOpen} onClose={closeBarangDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  padding: { xs: '12px 16px', sm: '16px 24px' }
                }}>
                  {selectedBarangIndex !== null ? 'Edit Barang' : 'Tambah Barang'}
                </DialogTitle>
                <DialogContent sx={{
                  padding: { xs: '8px 16px', sm: '16px 24px' }
                }}>
                  <Box sx={{ pt: { xs: 0.5, sm: 1 } }}>
                    {/* Filter Barang */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                        Filter Barang
                      </Typography>
                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            select
                            fullWidth
                            label="Kategori"
                            name="kategori"
                            value={filterKategori}
                            onChange={handleFilterChange}
                            size="small"
                            sx={{
                              '& .MuiInputLabel-root': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              },
                              '& .MuiInputBase-input': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              }
                            }}
                          >
                            <MenuItem value="">Semua Kategori</MenuItem>
                            {kategoris.map((kategori) => (
                              <MenuItem key={kategori.id} value={kategori.id}>
                                {kategori.nama}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            select
                            fullWidth
                            label="Lokasi"
                            name="lokasi"
                            value={filterLokasi}
                            onChange={handleFilterChange}
                            size="small"
                            sx={{
                              '& .MuiInputLabel-root': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              },
                              '& .MuiInputBase-input': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              }
                            }}
                          >
                            <MenuItem value="">Semua Lokasi</MenuItem>
                            {lokasis.map((lokasi) => (
                              <MenuItem key={lokasi.id} value={lokasi.id}>
                                {lokasi.nama}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            select
                            fullWidth
                            label="Kondisi"
                            name="kondisi"
                            value={filterKondisi}
                            onChange={handleFilterChange}
                            size="small"
                            sx={{
                              '& .MuiInputLabel-root': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              },
                              '& .MuiInputBase-input': {
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              }
                            }}
                          >
                            <MenuItem value="">Semua Kondisi</MenuItem>
                            <MenuItem value="baik">Baik</MenuItem>
                            <MenuItem value="rusak_ringan">Rusak Ringan</MenuItem>
                            <MenuItem value="rusak_berat">Rusak Berat</MenuItem>
                          </TextField>
                        </Grid>
                      </Grid>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Formik
                      initialValues={{
                        barang: selectedBarangIndex !== null
                          ? barangs.find(b => b.id === values.detail_peminjaman[selectedBarangIndex].id_barang) || null
                          : null,
                        jumlah: selectedBarangIndex !== null
                          ? values.detail_peminjaman[selectedBarangIndex].jumlah
                          : 1,
                      }}
                      validationSchema={Yup.object().shape({
                        barang: Yup.object().required('Barang wajib dipilih'),
                        jumlah: Yup.number()
                          .required('Jumlah wajib diisi')
                          .min(1, 'Jumlah minimal 1')
                          .integer('Jumlah harus berupa bilangan bulat')
                          .test(
                            'max-available',
                            'Jumlah melebihi stok tersedia',
                            function (value) {
                              const { barang } = this.parent;
                              if (!barang) return true;
                              return value <= barang.jumlah_tersedia;
                            }
                          ),
                      })}
                      onSubmit={(dialogValues) => {
                        // Menggunakan values dan setFieldValue dari form utama
                        addOrUpdateBarang({ values, setFieldValue }, dialogValues.barang, dialogValues.jumlah);
                      }}
                    >
                      {({ errors: dialogErrors, touched: dialogTouched, values: dialogValues, handleChange: dialogHandleChange, setFieldValue: dialogSetFieldValue, isSubmitting: dialogIsSubmitting }) => (
                        <Form>
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid item xs={12}>
                              <Autocomplete
                                options={barangs}
                                getOptionLabel={(option) => `${option.kode} - ${option.nama}`}
                                value={dialogValues.barang}
                                onChange={(_, newValue) => {
                                  dialogSetFieldValue('barang', newValue);
                                  if (newValue) {
                                    dialogSetFieldValue('jumlah', 1);
                                  }
                                }}
                                renderOption={(props, option) => {
                                  const currentDetailPeminjaman = Array.isArray(values.detail_peminjaman) ? values.detail_peminjaman : [];
                                  const isAlreadyAdded = currentDetailPeminjaman.some(item => item.id_barang === option.id);
                                  const { key, ...otherProps } = props;
                                  
                                  return (
                                    <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Box>
                                        <Typography variant="body2">
                                          {option.kode} - {option.nama}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Stok: {option.jumlah_tersedia} | Kondisi: {formatKondisiLabel(option.kondisi)}
                                        </Typography>
                                      </Box>
                                      {isAlreadyAdded && (
                                        <Chip
                                          label="Sudah Ditambahkan"
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ ml: 1, fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Box>
                                  );
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Pilih Barang"
                                    fullWidth
                                    required
                                    error={dialogTouched.barang && Boolean(dialogErrors.barang)}
                                    helperText={dialogTouched.barang && dialogErrors.barang}
                                    margin="normal"
                                    sx={{
                                      '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                      },
                                      '& .MuiInputBase-input': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                      },
                                      '& .MuiFormHelperText-root': {
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            {dialogValues.barang && (
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  Stok Tersedia: {dialogValues.barang.jumlah_tersedia} {dialogValues.barang.satuan || 'unit'}
                                </Typography>
                                {dialogValues.barang.kategori?.tipe === 'bahan' && (
                                  <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                                    * Bahan dapat digunakan sebagian - stok akan berkurang sesuai jumlah yang digunakan
                                  </Typography>
                                )}
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <TextField
                                name="jumlah"
                                label="Jumlah"
                                type="number"
                                fullWidth
                                required
                                value={dialogValues.jumlah}
                                onChange={dialogHandleChange}
                                InputProps={{ inputProps: { min: 1, max: dialogValues.barang?.jumlah_tersedia || 1 } }}
                                error={dialogTouched.jumlah && Boolean(dialogErrors.jumlah)}
                                helperText={dialogTouched.jumlah && dialogErrors.jumlah}
                                margin="normal"
                                sx={{
                                  '& .MuiInputLabel-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                  },
                                  '& .MuiInputBase-input': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                  },
                                  '& .MuiFormHelperText-root': {
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                          <DialogActions sx={{ 
                            mt: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1, sm: 0 },
                            padding: { xs: '8px 16px', sm: '8px 24px' }
                          }}>
                            <Button 
                              onClick={closeBarangDialog} 
                              color="secondary"
                              sx={{
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                padding: { xs: '6px 12px', sm: '8px 16px' },
                                width: { xs: '100%', sm: 'auto' }
                              }}
                            >
                              Batal
                            </Button>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={dialogIsSubmitting || !dialogValues.barang}
                              sx={{
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                padding: { xs: '6px 12px', sm: '8px 16px' },
                                width: { xs: '100%', sm: 'auto' }
                              }}
                            >
                              {selectedBarangIndex !== null ? 'Perbarui' : 'Tambah'}
                            </Button>
                          </DialogActions>
                        </Form>
                      )}
                    </Formik>
                  </Box>
                </DialogContent>
              </Dialog>
            </Form>
          )}
        </Formik>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informasi Peminjaman
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Kode Peminjaman
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {peminjaman.kode}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Status
                      </Typography>
                      <Chip
                        label={getStatusLabel(peminjaman.status)}
                        size="small"
                        color={getStatusColor(peminjaman.status)}
                        sx={{
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Peminjam
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {peminjaman.peminjam}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Kontak
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {peminjaman.kontak_peminjam || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Instansi
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {peminjaman.kelas_peminjam || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Jabatan
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {peminjaman.jabatan_peminjam || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Tanggal Pinjam
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(peminjaman.tanggal_pinjam)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Tanggal Kembali Harapan
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(peminjaman.tanggal_kembali)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Keterangan
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 500,
                        fontStyle: peminjaman.keterangan ? 'normal' : 'italic',
                        color: peminjaman.keterangan ? 'text.primary' : 'text.secondary'
                      }}>
                        {peminjaman.keterangan || 'Tidak ada keterangan'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* Tombol Edit - hanya untuk Admin/Toolman dan status menunggu persetujuan */}
                    {isAdminOrToolman() && peminjaman.status === 'menunggu_persetujuan' && (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/peminjaman/${id}/edit`)}
                        size="small"
                      >
                        Edit
                      </Button>
                    )}
                    
                    {/* Tombol Cetak Surat Pengajuan - untuk Admin/Toolman/Kepala Lab */}
                    {isAdminToolmanOrKepalaLab() && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handlePrintPDF}
                          size="small"
                        >
                          Download Surat Permohonan
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={handlePreviewPDF}
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          Preview Surat Permohonan
                        </Button>
                      </>
                    )}
                    
                    {/* Tombol Approval - hanya untuk Kepala Lab dan status menunggu persetujuan */}
                    {isKepalaLab() && peminjaman.status === 'menunggu_persetujuan' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setApprovalDialogOpen(true)}
                        size="small"
                      >
                        Proses Persetujuan
                      </Button>
                    )}
                    
                    {/* Tombol Hapus - hanya untuk Kepala Lab */}
                    {isKepalaLab() && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setConfirmDelete(true)}
                        size="small"
                      >
                        Hapus
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Barang yang Dipinjam
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: 'var(--primary-color)', color: 'white' } }}>
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white', 
                            width: '12%',
                            padding: '16px 12px',
                            fontSize: '0.875rem'
                          }}>Kode</TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            backgroundColor: 'var(--primary-light)', 
                            color: 'white', 
                            width: peminjaman.status === 'dikembalikan' ? '28%' : '35%',
                            padding: '16px 12px',
                            fontSize: '0.875rem'
                          }}>Nama Barang</TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white', 
                            width: '18%',
                            padding: '16px 12px',
                            fontSize: '0.875rem'
                          }}>Lokasi</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 600, 
                            backgroundColor: 'var(--primary-light)', 
                            color: 'white', 
                            width: '10%',
                            padding: '16px 12px',
                            fontSize: '0.875rem'
                          }}>Jumlah</TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 600, 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white', 
                            width: peminjaman.status === 'dikembalikan' ? '16%' : '25%',
                            padding: '16px 12px',
                            fontSize: '0.875rem'
                          }}>Kondisi Pinjam</TableCell>
                          {peminjaman.status === 'dikembalikan' && (
                            <TableCell align="center" sx={{ 
                              fontWeight: 600, 
                              backgroundColor: 'var(--primary-light)', 
                              color: 'white',
                              width: '16%',
                              padding: '16px 12px',
                              fontSize: '0.875rem'
                            }}>Kondisi Kembali</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {peminjaman.detail_peminjaman.map((item, index) => (
                          <TableRow key={index} sx={{
                            '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                            '&:hover': { backgroundColor: '#f0f8ff !important' }
                          }}>
                            <TableCell sx={{ 
                              padding: '14px 12px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                lineHeight: 1.3,
                                color: 'text.primary'
                              }}>
                                {item.kode_barang}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ 
                              padding: '14px 12px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {item.nama_barang}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ 
                              padding: '14px 12px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              <Typography variant="body2" sx={{
                                color: item.lokasi_ruangan ? 'text.primary' : 'text.secondary',
                                fontSize: '0.875rem',
                                lineHeight: 1.3,
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.lokasi_ruangan || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              padding: '14px 12px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'primary.main'
                              }}>
                                {item.jumlah}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              padding: '14px 12px',
                              borderRight: peminjaman.status === 'dikembalikan' ? '1px solid #e0e0e0' : 'none'
                            }}>
                               <Chip
                                 label={formatKondisiLabel(item.kondisi_saat_pinjam)}
                                 size="small"
                                 color={getKondisiColor(item.kondisi_saat_pinjam)}
                                 sx={{
                                   color: 'white',
                                   fontWeight: 'bold',
                                   fontSize: '0.75rem',
                                   height: '24px'
                                 }}
                               />
                             </TableCell>
                             {peminjaman.status === 'dikembalikan' && (
                               <TableCell align="center" sx={{ padding: '14px 12px' }}>
                                 {item.kondisi_saat_kembali ? (
                                   <Chip
                                     label={formatKondisiLabel(item.kondisi_saat_kembali)}
                                     size="small"
                                     color={getKondisiColor(item.kondisi_saat_kembali)}
                                     sx={{
                                       color: 'white',
                                       fontWeight: 'bold',
                                       fontSize: '0.75rem',
                                       height: '24px'
                                     }}
                                   />
                                 ) : (
                                   <Typography variant="body2" color="text.secondary">
                                     -
                                   </Typography>
                                 )}
                               </TableCell>
                             )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Detail Kondisi Barang Setelah Dipinjam - hanya muncul jika sudah dikembalikan */}
            {peminjaman.status === 'dikembalikan' && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detail Kondisi Barang Setelah Dipinjam
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                      <Table sx={{ width: '100%', tableLayout: 'auto', minWidth: '700px' }}>
                        <TableHead>
                          <TableRow sx={{ '& th': { backgroundColor: 'var(--primary-color)', color: 'white' } }}>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--primary-color)', color: 'white', minWidth: '200px', padding: '12px 8px' }}>Nama Barang</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: 'var(--primary-light)', color: 'white', minWidth: '70px', whiteSpace: 'nowrap', padding: '12px 8px' }}>Jumlah</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--primary-color)', color: 'white', minWidth: '120px', whiteSpace: 'nowrap', padding: '12px 8px' }}>Kondisi Saat Pinjam</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--primary-light)', color: 'white', minWidth: '120px', whiteSpace: 'nowrap', padding: '12px 8px' }}>Kondisi Saat Kembali</TableCell>
                            <TableCell sx={{ fontWeight: 600, backgroundColor: 'var(--primary-color)', color: 'white', minWidth: '180px', padding: '12px 8px' }}>Catatan Kembali</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {peminjaman.detail_peminjaman.map((item, index) => (
                            <TableRow key={index} sx={{
                              '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                              '&:hover': { backgroundColor: '#f0f8ff !important' }
                            }}>
                              <TableCell sx={{ padding: '12px 8px', minWidth: '200px' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, wordBreak: 'break-word' }}>
                                  {item.nama_barang}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.kode_barang}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ padding: '12px 8px', minWidth: '70px' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                  {item.jumlah}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ padding: '12px 8px', minWidth: '120px' }}>
                                <Chip
                                  label={formatKondisiLabel(item.kondisi_saat_pinjam)}
                                  size="small"
                                  color={getKondisiColor(item.kondisi_saat_pinjam)}
                                  sx={{
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ padding: '12px 8px', minWidth: '120px' }}>
                                {item.kondisi_saat_kembali ? (
                                  <Chip
                                    label={formatKondisiLabel(item.kondisi_saat_kembali)}
                                    size="small"
                                    color={getKondisiColor(item.kondisi_saat_kembali)}
                                    sx={{
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ padding: '12px 8px', minWidth: '180px' }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontStyle: item.catatan_kondisi ? 'normal' : 'italic',
                                    color: item.catatan_kondisi ? 'text.primary' : 'text.secondary',
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {item.catatan_kondisi || 'Tidak ada catatan'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Peminjaman"
        message={`Apakah Anda yakin ingin menghapus peminjaman dengan kode "${peminjaman?.kode}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />

      {/* Return Dialog */}
      <ReturnDialog
        open={confirmReturn}
        onClose={() => setConfirmReturn(false)}
        onConfirm={handleReturn}
        loading={returnLoading}
        peminjaman={peminjaman}
      />

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        onApprove={handleApproval}
        loading={approvalLoading}
        peminjamanId={peminjaman?.id}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploadLoading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Unggah Surat Peminjaman</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Unggah surat peminjaman yang sudah ditandatangani oleh Kepala Lab.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Check file type
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                    if (!allowedTypes.includes(file.type)) {
                      setFileError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
                      setSelectedFile(null);
                      return;
                    }

                    // Check file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      setFileError('Ukuran file terlalu besar. Maksimal 5MB.');
                      setSelectedFile(null);
                      return;
                    }

                    setSelectedFile(file);
                    setFileError('');
                  }
                }}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" component="span">
                  Pilih File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File terpilih: {selectedFile.name}
                </Typography>
              )}
              {fileError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {fileError}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Format yang didukung: JPG, PNG, PDF. Ukuran maksimal: 5MB
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploadLoading}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedFile || uploadLoading}
            onClick={() => handleUploadSurat(selectedFile)}
            startIcon={uploadLoading && <CircularProgress size={20} />}
          >
            Unggah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Component (hidden) */}
      <Box sx={{ display: 'none' }}>
        <PrintBorrowingLetter ref={printRef} peminjaman={peminjaman} />
      </Box>
    </>
  );
};

export default PeminjamanDetail;