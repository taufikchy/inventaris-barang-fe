import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
  const { canCRUD, canDeleteLokasiKategori } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lokasis, setLokasis] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentLokasi, setCurrentLokasi] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Table columns definition
  const columns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting
    },
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama Lokasi', sortable: true },
    { id: 'deskripsi', label: 'Deskripsi', sortable: true },
  ];

  // Table actions
  const actions = (row) => (
    <Box>
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
    </>
  );
};

export default Lokasi;