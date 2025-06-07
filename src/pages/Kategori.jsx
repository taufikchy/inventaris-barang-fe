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

// Validation schema for kategori form
const KategoriSchema = Yup.object().shape({
  nama: Yup.string().required('Nama kategori harus diisi'),
  deskripsi: Yup.string(),
});

const Kategori = () => {
  const { canCRUD, canDeleteLokasiKategori } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kategoris, setKategoris] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentKategori, setCurrentKategori] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch kategori data
  const fetchKategoris = async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const response = await axios.get('/api/kategori/dropdown');
      
      if (response.data.sukses) {
        setKategoris(response.data.data);
      } else {
        toast.error('Gagal memuat data kategori: ' + response.data.pesan);
        setKategoris([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching kategoris:', error);
      toast.error('Gagal memuat data kategori: ' + (error.response?.data?.pesan || error.message));
      setKategoris([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKategoris();
  }, []);

  // Handle form open for add/edit
  const handleOpenForm = (kategori = null) => {
    setCurrentKategori(kategori);
    setOpenForm(true);
  };

  // Handle form close
  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentKategori(null);
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (currentKategori) {
        // Update existing kategori
        const response = await axios.put(`/api/kategori/${currentKategori.id}`, values);
        
        if (response.data.sukses) {
          toast.success('Kategori berhasil diperbarui');
          fetchKategoris(); // Refresh data
        } else {
          toast.error('Gagal memperbarui kategori: ' + response.data.pesan);
        }
      } else {
        // Add new kategori
        const response = await axios.post('/api/kategori', values);
        
        if (response.data.sukses) {
          toast.success('Kategori berhasil ditambahkan');
          fetchKategoris(); // Refresh data
        } else {
          toast.error('Gagal menambahkan kategori: ' + response.data.pesan);
        }
      }
      
      handleCloseForm();
      resetForm();
    } catch (error) {
      console.error('Error submitting kategori:', error);
      toast.error('Gagal menyimpan kategori: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (kategori) => {
    setCurrentKategori(kategori);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`/api/kategori/${currentKategori.id}`);
      
      if (response.data.sukses) {
        toast.success('Kategori berhasil dihapus');
        fetchKategoris(); // Refresh data
      } else {
        toast.error('Gagal menghapus kategori: ' + response.data.pesan);
      }
      
      setConfirmDelete(false);
      setCurrentKategori(null);
    } catch (error) {
      console.error('Error deleting kategori:', error);
      toast.error('Gagal menghapus kategori: ' + (error.response?.data?.pesan || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table columns definition
  const columns = [
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama Kategori', sortable: true },
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
        title="Kategori Barang"
        actionText={canCRUD() ? "Tambah Kategori" : undefined}
        actionIcon={canCRUD() ? <AddIcon /> : undefined}
        onActionClick={canCRUD() ? () => handleOpenForm() : undefined}
      />

      <DataTable
        title="Daftar Kategori"
        columns={columns}
        rows={kategoris}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchKategoris}
        emptyMessage="Belum ada data kategori"
      />

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{currentKategori ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        <Formik
          initialValues={{
            nama: currentKategori?.nama || '',
            deskripsi: currentKategori?.deskripsi || '',
          }}
          validationSchema={KategoriSchema}
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
                  label="Nama Kategori"
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
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${currentKategori?.nama}"?`}
        confirmText="Hapus"
        confirmButtonColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    </>
  );
};

export default Kategori;