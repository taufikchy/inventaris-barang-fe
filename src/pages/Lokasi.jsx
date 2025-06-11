import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

// Validation schema for lokasi form
const LokasiSchema = Yup.object().shape({
  nama: Yup.string().required('Nama lokasi harus diisi'),
  deskripsi: Yup.string(),
});

const Lokasi = () => {
  const navigate = useNavigate();
  const { canCRUD, canDeleteLokasiKategori } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lokasis, setLokasis] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentLokasi, setCurrentLokasi] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State untuk dialog detail barang per lokasi
  const [barangDialogOpen, setBarangDialogOpen] = useState(false);
  const [selectedLokasi, setSelectedLokasi] = useState(null);
  const [barangLoading, setBarangLoading] = useState(false);
  const [barangPerLokasi, setBarangPerLokasi] = useState([]);
  const [barangFilters, setBarangFilters] = useState({
    kondisi: '',
    status: '',
  });

  // Fetch lokasi data
  const fetchLokasis = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const response = await axios.get('/api/lokasi/dropdown');
      
      if (response.data.sukses) {
        setLokasis(response.data.data);
      } else {
        toast.error('Gagal memuat data lokasi: ' + response.data.pesan);
        setLokasis([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lokasis:', error);
      toast.error('Gagal memuat data lokasi: ' + (error.response?.data?.pesan || error.message));
      setLokasis([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLokasis();
  }, []);

  // Handle form open for add/edit
  const handleOpenForm = (lokasi = null) => {
    setCurrentLokasi(lokasi);
    setOpenForm(true);
  };

  // Handle form close
  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentLokasi(null);
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (currentLokasi) {
        // Update existing lokasi
        const response = await axios.put(`/api/lokasi/${currentLokasi.id}`, values);
        
        if (response.data.sukses) {
          toast.success('Lokasi berhasil diperbarui');
          fetchLokasis(); // Refresh data
        } else {
          toast.error('Gagal memperbarui lokasi: ' + response.data.pesan);
        }
      } else {
        // Add new lokasi
        const response = await axios.post('/api/lokasi', values);
        
        if (response.data.sukses) {
          toast.success('Lokasi berhasil ditambahkan');
          fetchLokasis(); // Refresh data
        } else {
          toast.error('Gagal menambahkan lokasi: ' + response.data.pesan);
        }
      }
      
      handleCloseForm();
      resetForm();
    } catch (error) {
      console.error('Error submitting lokasi:', error);
      toast.error('Gagal menyimpan lokasi: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (lokasi) => {
    setCurrentLokasi(lokasi);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`/api/lokasi/${currentLokasi.id}`);
      
      if (response.data.sukses) {
        toast.success('Lokasi berhasil dihapus');
        fetchLokasis(); // Refresh data
      } else {
        toast.error('Gagal menghapus lokasi: ' + response.data.pesan);
      }
      
      setConfirmDelete(false);
      setCurrentLokasi(null);
    } catch (error) {
      console.error('Error deleting lokasi:', error);
      toast.error('Gagal menghapus lokasi: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fetch barang berdasarkan lokasi
  const fetchBarangByLokasi = async (lokasiId) => {
    try {
      setBarangLoading(true);
      
      // Fetch data from API
      const response = await axios.get(`/api/barang?lokasi=${lokasiId}`);
      
      if (response.data.sukses) {
        setBarangPerLokasi(response.data.data);
      } else {
        toast.error('Gagal memuat data barang: ' + response.data.pesan);
        setBarangPerLokasi([]);
      }
      
      setBarangLoading(false);
    } catch (error) {
      console.error('Error fetching barang by lokasi:', error);
      toast.error('Gagal memuat data barang: ' + (error.response?.data?.pesan || error.message));
      setBarangPerLokasi([]);
      setBarangLoading(false);
    }
  };

  // Handle buka dialog detail barang per lokasi
  const handleOpenBarangDialog = (lokasi) => {
    setSelectedLokasi(lokasi);
    setBarangDialogOpen(true);
    fetchBarangByLokasi(lokasi.id);
  };

  // Handle tutup dialog detail barang per lokasi
  const handleCloseBarangDialog = () => {
    setBarangDialogOpen(false);
    setSelectedLokasi(null);
    setBarangPerLokasi([]);
    setBarangFilters({
      kondisi: '',
      status: '',
    });
  };

  // Handle filter barang change
  const handleBarangFilterChange = (event) => {
    const { name, value } = event.target;
    setBarangFilters({
      ...barangFilters,
      [name]: value,
    });
  };

  // Apply filters to barang data
  const getFilteredBarang = () => {
    if (!barangPerLokasi) return [];
    
    return barangPerLokasi.filter((barang) => {
      return (
        (barangFilters.kondisi === '' || barang.kondisi === barangFilters.kondisi) &&
        (barangFilters.status === '' || barang.status === barangFilters.status)
      );
    });
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

  // Table columns definition
  const columns = [
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama Lokasi', sortable: true },
    { id: 'deskripsi', label: 'Deskripsi', sortable: true },
  ];

  // Table actions
  const actions = (row) => (
    <Box>
      <Tooltip title="Lihat Barang">
        <IconButton onClick={() => handleOpenBarangDialog(row)} size="small" color="info">
          <InventoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canCRUD() && (
        <Tooltip title="Edit">
          <IconButton onClick={() => handleOpenForm(row)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDeleteLokasiKategori() && (
        <Tooltip title="Hapus">
          <IconButton onClick={() => handleDeleteConfirm(row)} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Lokasi Barang"
        actionText={canCRUD() ? "Tambah Lokasi" : undefined}
        actionIcon={canCRUD() ? <AddIcon /> : undefined}
        onActionClick={canCRUD() ? () => handleOpenForm() : undefined}
      />

      <DataTable
        title="Daftar Lokasi"
        columns={columns}
        rows={lokasis}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchLokasis}
        emptyMessage="Belum ada data lokasi"
      />

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{currentLokasi ? 'Edit Lokasi' : 'Tambah Lokasi'}</DialogTitle>
        <Formik
          initialValues={{
            nama: currentLokasi?.nama || '',
            deskripsi: currentLokasi?.deskripsi || '',
          }}
          validationSchema={LokasiSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  fullWidth
                  margin="normal"
                  name="nama"
                  label="Nama Lokasi"
                  error={touched.nama && Boolean(errors.nama)}
                  helperText={touched.nama && errors.nama}
                />
                <Field
                  as={TextField}
                  fullWidth
                  margin="normal"
                  name="deskripsi"
                  label="Deskripsi"
                  multiline
                  rows={3}
                  error={touched.deskripsi && Boolean(errors.deskripsi)}
                  helperText={touched.deskripsi && errors.deskripsi}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseForm}>Batal</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Lokasi"
        message={`Apakah Anda yakin ingin menghapus lokasi "${currentLokasi?.nama}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />

      {/* Dialog Detail Barang per Lokasi */}
      <Dialog
        open={barangDialogOpen}
        onClose={handleCloseBarangDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detail Barang di {selectedLokasi?.nama}
        </DialogTitle>
        <DialogContent>
          {barangLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Filter */}
              <Box sx={{ mb: 3, mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Filter Kondisi"
                      name="kondisi"
                      value={barangFilters.kondisi}
                      onChange={handleBarangFilterChange}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="">Semua Kondisi</MenuItem>
                      <MenuItem value="Baik">Baik</MenuItem>
                      <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                      <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Filter Status"
                      name="status"
                      value={barangFilters.status}
                      onChange={handleBarangFilterChange}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="">Semua Status</MenuItem>
                      <MenuItem value="Tersedia">Tersedia</MenuItem>
                      <MenuItem value="Dipinjam">Dipinjam</MenuItem>
                      <MenuItem value="Perbaikan">Perbaikan</MenuItem>
                      <MenuItem value="Rusak">Rusak</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              {/* Table */}
              {getFilteredBarang().length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Kode Barang</TableCell>
                        <TableCell>Nama Barang</TableCell>
                        <TableCell>Kategori</TableCell>
                        <TableCell>Kondisi</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Jumlah Unit</TableCell>
                        <TableCell>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredBarang().map((barang, index) => (
                        <TableRow 
                          key={barang.id}
                          sx={{
                            '&:nth-of-type(even)': { backgroundColor: '#f9f9f9' },
                            '&:hover': { backgroundColor: '#e8f4f8' },
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{barang.kode}</TableCell>
                          <TableCell>{barang.nama}</TableCell>
                          <TableCell>{barang.kategori?.nama || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={barang.kondisi} 
                              size="small" 
                              color={getKondisiColor(barang.kondisi)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={barang.status} 
                              size="small" 
                              color={getStatusColor(barang.status)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{barang.units?.length || 0}</TableCell>
                          <TableCell>
                            <Tooltip title="Lihat Detail">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => navigate(`/barang/${barang.id}`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Tidak ada barang yang ditemukan di lokasi ini{barangFilters.kondisi || barangFilters.status ? ' dengan filter yang dipilih' : ''}.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBarangDialog}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Lokasi;