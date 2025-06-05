import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';

// Validation schema for barang form
const BarangSchema = Yup.object().shape({
  kode: Yup.string().required('Kode barang wajib diisi'),
  nama: Yup.string().required('Nama barang wajib diisi'),
  deskripsi: Yup.string(),
  jumlah: Yup.number()
    .required('Jumlah barang wajib diisi')
    .min(0, 'Jumlah tidak boleh negatif')
    .integer('Jumlah harus berupa bilangan bulat'),
  kondisi: Yup.string().required('Kondisi barang wajib diisi'),
  tanggal_perolehan: Yup.date().required('Tanggal perolehan wajib diisi'),
  harga_perolehan: Yup.number()
    .required('Harga perolehan wajib diisi')
    .min(0, 'Harga tidak boleh negatif'),
  id_kategori: Yup.number().required('Kategori wajib dipilih'),
  id_lokasi: Yup.number().required('Lokasi wajib dipilih'),
  status: Yup.string().required('Status barang wajib diisi'),
});

const BarangDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewBarang = id === 'new';
  const isEditMode = location.state?.edit || isNewBarang;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barang, setBarang] = useState(null);
  const [kategoris, setKategoris] = useState([]);
  const [lokasis, setLokasis] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Fetch barang data
  const fetchBarang = async () => {
    if (isNewBarang) {
      // Initialize new barang
      setBarang({
        kode: '',
        nama: '',
        deskripsi: '',
        jumlah: 0,
        kondisi: 'Baik',
        tanggal_perolehan: new Date().toISOString().split('T')[0],
        harga_perolehan: 0,
        id_kategori: '',
        id_lokasi: '',
        status: 'Tersedia',
        gambar: '',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch data from API
      const response = await axios.get(`/api/barang/${id}`);
      
      if (response.data.sukses) {
        setBarang(response.data.data);
      } else {
        toast.error('Gagal memuat data barang: ' + response.data.pesan);
        navigate('/barang');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barang:', error);
      toast.error('Gagal memuat data barang: ' + (error.response?.data?.pesan || error.message));
      navigate('/barang');
      setLoading(false);
    }
  };

  // Fetch kategori and lokasi data
  const fetchKategoriAndLokasi = async () => {
    try {
      // Fetch kategori data
      const kategoriResponse = await axios.get('/api/kategori/dropdown');
      if (kategoriResponse.data.sukses) {
        setKategoris(kategoriResponse.data.data);
      } else {
        toast.error('Gagal memuat data kategori: ' + kategoriResponse.data.pesan);
        setKategoris([]);
      }
      
      // Fetch lokasi data
      const lokasiResponse = await axios.get('/api/lokasi/dropdown');
      if (lokasiResponse.data.sukses) {
        setLokasis(lokasiResponse.data.data);
      } else {
        toast.error('Gagal memuat data lokasi: ' + lokasiResponse.data.pesan);
        setLokasis([]);
      }
    } catch (error) {
      console.error('Error fetching kategori and lokasi:', error);
      toast.error('Gagal memuat data kategori dan lokasi: ' + (error.response?.data?.pesan || error.message));
    }
  };

  useEffect(() => {
    fetchBarang();
    fetchKategoriAndLokasi();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle image change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSaving(true);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });
      
      // Add image file if exists
      if (imageFile) {
        formData.append('gambar', imageFile);
      }
      
      let response;
      
      if (isNewBarang) {
        // Create new barang
        response = await axios.post('/api/barang', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Update existing barang
        response = await axios.put(`/api/barang/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      if (response.data.sukses) {
        toast.success(isNewBarang ? 'Barang berhasil ditambahkan' : 'Barang berhasil diperbarui');
        
        // Redirect to barang list after successful save
        if (isNewBarang) {
          navigate('/barang');
        } else {
          // Update local state and exit edit mode
          fetchBarang(); // Refresh data
          navigate(`/barang/${id}`, { replace: true });
        }
      } else {
        toast.error(response.data.pesan || (isNewBarang ? 'Gagal menambahkan barang' : 'Gagal memperbarui barang'));
      }
    } catch (error) {
      console.error('Error saving barang:', error);
      toast.error(isNewBarang ? 'Gagal menambahkan barang: ' : 'Gagal memperbarui barang: ' + 
        (error.response?.data?.pesan || error.message));
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`/api/barang/${id}`);
      
      if (response.data.sukses) {
        toast.success('Barang berhasil dihapus');
        navigate('/barang');
      } else {
        toast.error('Gagal menghapus barang: ' + response.data.pesan);
        setConfirmDelete(false);
      }
    } catch (error) {
      console.error('Error deleting barang:', error);
      toast.error('Gagal menghapus barang: ' + (error.response?.data?.pesan || error.message));
      setConfirmDelete(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Tersedia':
        return 'success';
      case 'Dipinjam':
        return 'primary';
      case 'Perbaikan':
        return 'warning';
      case 'Rusak':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get kondisi chip color
  const getKondisiColor = (kondisi) => {
    switch (kondisi) {
      case 'Baik':
        return 'success';
      case 'Rusak Ringan':
        return 'warning';
      case 'Rusak Berat':
        return 'error';
      default:
        return 'default';
    }
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
        title={isNewBarang ? 'Tambah Barang Baru' : 'Detail Barang'}
        backButton
        onBackClick={() => navigate('/barang')}
        actionButton={!isNewBarang && !isEditMode ? {
          icon: <EditIcon />,
          text: 'Edit',
          onClick: () => navigate(`/barang/${id}`, { state: { edit: true } }),
        } : null}
      />

      {isEditMode ? (
        <Formik
          initialValues={{
            kode: barang.kode,
            nama: barang.nama,
            deskripsi: barang.deskripsi || '',
            jumlah: barang.jumlah,
            kondisi: barang.kondisi,
            tanggal_perolehan: barang.tanggal_perolehan,
            harga_perolehan: barang.harga_perolehan,
            id_kategori: barang.id_kategori,
            id_lokasi: barang.id_lokasi,
            status: barang.status,
          }}
          validationSchema={BarangSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values, handleChange }) => (
            <Form>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ position: 'relative' }}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="250"
                          image={imagePreview || barang.gambar || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={values.nama}
                          sx={{ objectFit: 'contain', bgcolor: 'grey.100', p: 2 }}
                        />
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <input
                              accept="image/*"
                              id="icon-button-file"
                              type="file"
                              onChange={handleImageChange}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="icon-button-file">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<PhotoCameraIcon />}
                                size="small"
                                fullWidth
                              >
                                Ubah Gambar
                              </Button>
                            </label>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          name="kode"
                          label="Kode Barang"
                          fullWidth
                          required
                          error={touched.kode && Boolean(errors.kode)}
                          helperText={touched.kode && errors.kode}
                          disabled={!isNewBarang} // Kode can't be changed after creation
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          name="nama"
                          label="Nama Barang"
                          fullWidth
                          required
                          error={touched.nama && Boolean(errors.nama)}
                          helperText={touched.nama && errors.nama}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          name="deskripsi"
                          label="Deskripsi"
                          fullWidth
                          multiline
                          rows={3}
                          error={touched.deskripsi && Boolean(errors.deskripsi)}
                          helperText={touched.deskripsi && errors.deskripsi}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          select
                          name="id_kategori"
                          label="Kategori"
                          fullWidth
                          required
                          value={values.id_kategori}
                          onChange={handleChange}
                          error={touched.id_kategori && Boolean(errors.id_kategori)}
                          helperText={touched.id_kategori && errors.id_kategori}
                        >
                          {kategoris.map((kategori) => (
                            <MenuItem key={kategori.id} value={kategori.id}>
                              {kategori.nama}
                            </MenuItem>
                          ))}
                        </Field>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          select
                          name="id_lokasi"
                          label="Lokasi"
                          fullWidth
                          required
                          value={values.id_lokasi}
                          onChange={handleChange}
                          error={touched.id_lokasi && Boolean(errors.id_lokasi)}
                          helperText={touched.id_lokasi && errors.id_lokasi}
                        >
                          {lokasis.map((lokasi) => (
                            <MenuItem key={lokasi.id} value={lokasi.id}>
                              {lokasi.nama}
                            </MenuItem>
                          ))}
                        </Field>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          name="jumlah"
                          label="Jumlah"
                          type="number"
                          fullWidth
                          required
                          InputProps={{ inputProps: { min: 0 } }}
                          error={touched.jumlah && Boolean(errors.jumlah)}
                          helperText={touched.jumlah && errors.jumlah}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          select
                          name="kondisi"
                          label="Kondisi"
                          fullWidth
                          required
                          value={values.kondisi}
                          onChange={handleChange}
                          error={touched.kondisi && Boolean(errors.kondisi)}
                          helperText={touched.kondisi && errors.kondisi}
                        >
                          <MenuItem value="Baik">Baik</MenuItem>
                          <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                          <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
                        </Field>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          select
                          name="status"
                          label="Status"
                          fullWidth
                          required
                          value={values.status}
                          onChange={handleChange}
                          error={touched.status && Boolean(errors.status)}
                          helperText={touched.status && errors.status}
                        >
                          <MenuItem value="Tersedia">Tersedia</MenuItem>
                          <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                          <MenuItem value="Perbaikan">Perbaikan</MenuItem>
                          <MenuItem value="Rusak">Rusak</MenuItem>
                        </Field>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          name="tanggal_perolehan"
                          label="Tanggal Perolehan"
                          type="date"
                          fullWidth
                          required
                          InputLabelProps={{ shrink: true }}
                          error={touched.tanggal_perolehan && Boolean(errors.tanggal_perolehan)}
                          helperText={touched.tanggal_perolehan && errors.tanggal_perolehan}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          name="harga_perolehan"
                          label="Harga Perolehan"
                          type="number"
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                            inputProps: { min: 0 }
                          }}
                          error={touched.harga_perolehan && Boolean(errors.harga_perolehan)}
                          helperText={touched.harga_perolehan && errors.harga_perolehan}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => isNewBarang ? navigate('/barang') : navigate(`/barang/${id}`, { replace: true })}
                    startIcon={<CancelIcon />}
                  >
                    Batal
                  </Button>
                  <Box>
                    {!isNewBarang && (
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
                      {isNewBarang ? 'Tambah' : 'Simpan'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Form>
          )}
        </Formik>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Informasi Barang" />
              <Tab label="Riwayat Peminjaman" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="250"
                        image={barang.gambar || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={barang.nama}
                        sx={{ objectFit: 'contain', bgcolor: 'grey.100', p: 2 }}
                      />
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" gutterBottom>
                      {barang.nama}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Kode: {barang.kode}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={barang.status}
                        size="small"
                        color={getStatusColor(barang.status)}
                      />
                      <Chip
                        label={barang.kondisi}
                        size="small"
                        color={getKondisiColor(barang.kondisi)}
                      />
                    </Box>
                    
                    <Typography variant="body1" paragraph>
                      {barang.deskripsi || 'Tidak ada deskripsi'}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Kategori
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {barang.kategori}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Lokasi
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {barang.lokasi}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Jumlah
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {barang.jumlah} unit
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Tanggal Perolehan
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(barang.tanggal_perolehan)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Harga Perolehan
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatCurrency(barang.harga_perolehan)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Riwayat Peminjaman
                </Typography>
                
                {/* Mock data for peminjaman history */}
                {[
                  {
                    id: 1,
                    peminjam: 'Budi Santoso',
                    tanggal_pinjam: '2023-05-10',
                    tanggal_kembali: '2023-05-15',
                    status: 'Dikembalikan',
                    jumlah: 2,
                  },
                  {
                    id: 2,
                    peminjam: 'Ani Wijaya',
                    tanggal_pinjam: '2023-06-20',
                    tanggal_kembali: '2023-06-25',
                    status: 'Dikembalikan',
                    jumlah: 1,
                  },
                ].length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {[
                      {
                        id: 1,
                        peminjam: 'Budi Santoso',
                        tanggal_pinjam: '2023-05-10',
                        tanggal_kembali: '2023-05-15',
                        status: 'Dikembalikan',
                        jumlah: 2,
                      },
                      {
                        id: 2,
                        peminjam: 'Ani Wijaya',
                        tanggal_pinjam: '2023-06-20',
                        tanggal_kembali: '2023-06-25',
                        status: 'Dikembalikan',
                        jumlah: 1,
                      },
                    ].map((pinjam) => (
                      <Card key={pinjam.id} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Peminjam
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {pinjam.peminjam}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Jumlah
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {pinjam.jumlah} unit
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Tanggal Pinjam
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {formatDate(pinjam.tanggal_pinjam)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Tanggal Kembali
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {formatDate(pinjam.tanggal_kembali)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Chip
                              label={pinjam.status}
                              size="small"
                              color={pinjam.status === 'Dikembalikan' ? 'success' : 'primary'}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    Belum ada riwayat peminjaman untuk barang ini.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Barang"
        message={`Apakah Anda yakin ingin menghapus barang "${barang?.nama}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    </>
  );
};

export default BarangDetail;