import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
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
import PrintBorrowingLetter from '../components/PrintBorrowingLetter';

// Validation schema for peminjaman form
const PeminjamanSchema = Yup.object().shape({
  peminjam: Yup.string().required('Nama peminjam wajib diisi'),
  tanggal_pinjam: Yup.date().required('Tanggal pinjam wajib diisi'),
  tanggal_kembali: Yup.date().nullable(),
  keterangan: Yup.string(),
  status: Yup.string().required('Status peminjaman wajib diisi'),
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
  const isNewPeminjaman = id === 'new';
  const isEditMode = location.pathname.includes('/edit') || isNewPeminjaman;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [peminjaman, setPeminjaman] = useState(null);
  const [barangs, setBarangs] = useState([]);
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

  // Fetch peminjaman data
  const fetchPeminjaman = async () => {
    if (isNewPeminjaman) {
      // Initialize new peminjaman
      setPeminjaman({
        kode: 'PJM-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        peminjam: '',
        tanggal_pinjam: new Date().toISOString().split('T')[0],
        tanggal_kembali: null,
        status: 'menunggu_persetujuan',
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
        setPeminjaman(response.data.data);
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
      // Fetch data from API
      const response = await axios.get('/api/barang/dropdown?tersedia=true');
      
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

  useEffect(() => {
    fetchPeminjaman();
    fetchBarangs();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSaving(true);
      
      let response;
      
      if (isNewPeminjaman) {
        // Create new peminjaman
        response = await axios.post('/api/peminjaman', values);
      } else {
        // Update existing peminjaman
        response = await axios.put(`/api/peminjaman/${id}`, values);
      }
      
      if (response.data.sukses) {
        toast.success(isNewPeminjaman ? 'Peminjaman berhasil ditambahkan' : 'Peminjaman berhasil diperbarui');
        
        // Redirect to peminjaman list after successful save
        if (isNewPeminjaman) {
          navigate('/peminjaman');
        } else {
          // Update local state and exit edit mode
          setPeminjaman({
            ...peminjaman,
            ...values,
          });
          navigate(`/peminjaman/${id}`);
        }
      } else {
        toast.error((isNewPeminjaman ? 'Gagal menambahkan peminjaman: ' : 'Gagal memperbarui peminjaman: ') + response.data.pesan);
      }
    } catch (error) {
      console.error('Error saving peminjaman:', error);
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
  const handleReturn = async () => {
    try {
      setReturnLoading(true);
      const response = await axios.put(`/api/peminjaman/${id}/kembalikan`, {
        kondisi_barang: 'baik', // Default kondisi
        catatan: 'Barang dikembalikan'
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
        kondisi_saat_pinjam: barang.kondisi,
      };
      setFieldValue('detail_peminjaman', updatedDetailPeminjaman);
    } else {
      // Add new barang
      const newBarang = {
        id_barang: barang.id,
        nama_barang: barang.nama,
        kode_barang: barang.kode,
        jumlah: parseInt(jumlah),
        kondisi_saat_pinjam: barang.kondisi,
      };
      setFieldValue('detail_peminjaman', [...values.detail_peminjaman, newBarang]);
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
        actionButton={!isNewPeminjaman && !isEditMode && peminjaman.status === 'disetujui' ? {
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
            tanggal_pinjam: peminjaman.tanggal_pinjam,
            tanggal_kembali: peminjaman.tanggal_kembali || '',
            status: peminjaman.status,
            keterangan: peminjaman.keterangan || '',
            detail_peminjaman: peminjaman.detail_peminjaman || [],
          }}
          validationSchema={PeminjamanSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values, handleChange, setFieldValue }) => (
            <Form>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Informasi Peminjaman
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Kode Peminjaman"
                      value={peminjaman.kode}
                      disabled
                      size="small"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      name="peminjam"
                      label="Nama Peminjam"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      error={touched.peminjam && Boolean(errors.peminjam)}
                      helperText={touched.peminjam && errors.peminjam}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
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
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      name="tanggal_kembali"
                      label="Tanggal Kembali"
                      type="date"
                      fullWidth
                      size="small"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      error={touched.tanggal_kembali && Boolean(errors.tanggal_kembali)}
                      helperText={touched.tanggal_kembali && errors.tanggal_kembali}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      select
                      name="status"
                      label="Status"
                      fullWidth
                      required
                      size="small"
                      margin="normal"
                      value={values.status}
                      onChange={handleChange}
                      error={touched.status && Boolean(errors.status)}
                      helperText={touched.status && errors.status}
                    >
                      <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                      <MenuItem value="Dikembalikan">Dikembalikan</MenuItem>
                      <MenuItem value="Terlambat">Terlambat</MenuItem>
                    </Field>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="keterangan"
                      label="Keterangan"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      margin="normal"
                      error={touched.keterangan && Boolean(errors.keterangan)}
                      helperText={touched.keterangan && errors.keterangan}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Barang yang Dipinjam
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => openBarangDialog()}
                    size="small"
                  >
                    Tambah Barang
                  </Button>
                </Box>

                <FieldArray name="detail_peminjaman">
                  {() => (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Kode</TableCell>
                            <TableCell>Nama Barang</TableCell>
                            <TableCell align="right">Jumlah</TableCell>
                            <TableCell>Kondisi</TableCell>
                            <TableCell align="center">Aksi</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {values.detail_peminjaman.length > 0 ? (
                            values.detail_peminjaman.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.kode_barang}</TableCell>
                                <TableCell>{item.nama_barang}</TableCell>
                                <TableCell align="right">{item.jumlah}</TableCell>
                                <TableCell>{item.kondisi_saat_pinjam}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => openBarangDialog(index)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => removeBarang({ values, setFieldValue }, index)}
                                    color="error"
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                Belum ada barang yang dipilih
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </FieldArray>
                {errors.detail_peminjaman && typeof errors.detail_peminjaman === 'string' && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {errors.detail_peminjaman}
                  </Typography>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => isNewPeminjaman ? navigate('/peminjaman') : navigate(`/peminjaman/${id}`)}
                    startIcon={<CancelIcon />}
                  >
                    Batal
                  </Button>
                  <Box>
                    {!isNewPeminjaman && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setConfirmDelete(true)}
                        startIcon={<DeleteIcon />}
                        sx={{ mr: 1 }}
                      >
                        Hapus
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {isNewPeminjaman ? 'Tambah' : 'Simpan'}
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Barang Dialog */}
              <Dialog open={barangDialogOpen} onClose={closeBarangDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                  {selectedBarangIndex !== null ? 'Edit Barang' : 'Tambah Barang'}
                </DialogTitle>
                <DialogContent>
                  <Box sx={{ pt: 1 }}>
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
                      onSubmit={(values) => {
                        addOrUpdateBarang({ values, setFieldValue }, values.barang, values.jumlah);
                      }}
                    >
                      {({ errors: dialogErrors, touched: dialogTouched, values: dialogValues, handleChange: dialogHandleChange, setFieldValue: dialogSetFieldValue, isSubmitting: dialogIsSubmitting }) => (
                        <Form>
                          <Grid container spacing={2}>
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
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Pilih Barang"
                                    fullWidth
                                    required
                                    error={dialogTouched.barang && Boolean(dialogErrors.barang)}
                                    helperText={dialogTouched.barang && dialogErrors.barang}
                                    margin="normal"
                                  />
                                )}
                              />
                            </Grid>
                            {dialogValues.barang && (
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                  Stok Tersedia: {dialogValues.barang.jumlah_tersedia} unit
                                </Typography>
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
                              />
                            </Grid>
                          </Grid>
                          <DialogActions sx={{ mt: 2 }}>
                            <Button onClick={closeBarangDialog} color="secondary">
                              Batal
                            </Button>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={dialogIsSubmitting || !dialogValues.barang}
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
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Kode Peminjaman
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {peminjaman.kode}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={getStatusLabel(peminjaman.status)}
                      size="small"
                      color={getStatusColor(peminjaman.status)}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Peminjam
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {peminjaman.peminjam}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tanggal Pinjam
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDate(peminjaman.tanggal_pinjam)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tanggal Kembali
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDate(peminjaman.tanggal_kembali)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Keterangan
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {peminjaman.keterangan || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/peminjaman/${id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Hapus
                    </Button>
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
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kode</TableCell>
                          <TableCell>Nama Barang</TableCell>
                          <TableCell align="right">Jumlah</TableCell>
                          <TableCell>Kondisi Saat Pinjam</TableCell>
                          {peminjaman.status === 'Dikembalikan' && (
                            <TableCell>Kondisi Saat Kembali</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {peminjaman.detail_peminjaman.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.kode_barang}</TableCell>
                            <TableCell>{item.nama_barang}</TableCell>
                            <TableCell align="right">{item.jumlah}</TableCell>
                            <TableCell>{item.kondisi_saat_pinjam}</TableCell>
                            {peminjaman.status === 'Dikembalikan' && (
                              <TableCell>{item.kondisi_saat_kembali}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
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

      {/* Confirm Return Dialog */}
      <ConfirmDialog
        open={confirmReturn}
        title="Kembalikan Peminjaman"
        message={`Apakah Anda yakin ingin mengembalikan peminjaman dengan kode "${peminjaman?.kode}"?`}
        confirmText="Kembalikan"
        confirmButtonColor="success"
        onConfirm={handleReturn}
        onCancel={() => setConfirmReturn(false)}
        loading={returnLoading}
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