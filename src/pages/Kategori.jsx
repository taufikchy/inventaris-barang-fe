import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData = [
        { id: 1, nama: 'Komputer', deskripsi: 'Perangkat komputer dan laptop' },
        { id: 2, nama: 'Periferal', deskripsi: 'Perangkat pendukung komputer' },
        { id: 3, nama: 'Jaringan', deskripsi: 'Perangkat jaringan komputer' },
        { id: 4, nama: 'Alat Ukur', deskripsi: 'Perangkat untuk pengukuran' },
        { id: 5, nama: 'Media Pembelajaran', deskripsi: 'Media untuk kegiatan belajar mengajar' },
        { id: 6, nama: 'Lainnya', deskripsi: 'Kategori lain-lain' },
      ];
      
      setKategoris(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching kategoris:', error);
      toast.error('Gagal memuat data kategori');
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
      // In a real application, you would send this data to your API
      console.log('Submitting kategori:', values);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentKategori) {
        // Update existing kategori
        const updatedKategoris = kategoris.map(k =>
          k.id === currentKategori.id ? { ...values, id: currentKategori.id } : k
        );
        setKategoris(updatedKategoris);
        toast.success('Kategori berhasil diperbarui');
      } else {
        // Add new kategori
        const newKategori = {
          ...values,
          id: Math.max(0, ...kategoris.map(k => k.id)) + 1,
        };
        setKategoris([...kategoris, newKategori]);
        toast.success('Kategori berhasil ditambahkan');
      }
      
      resetForm();
      handleCloseForm();
    } catch (error) {
      console.error('Error submitting kategori:', error);
      toast.error('Gagal menyimpan kategori');
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
      
      // In a real application, you would send this request to your API
      console.log('Deleting kategori:', currentKategori);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from state
      setKategoris(kategoris.filter(k => k.id !== currentKategori.id));
      toast.success('Kategori berhasil dihapus');
      
      setConfirmDelete(false);
      setCurrentKategori(null);
    } catch (error) {
      console.error('Error deleting kategori:', error);
      toast.error('Gagal menghapus kategori');
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
      <Tooltip title="Edit">
        <IconButton onClick={() => handleOpenForm(row)} size="small">
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Hapus">
        <IconButton onClick={() => handleDeleteConfirm(row)} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Kategori Barang"
        actionText="Tambah Kategori"
        actionIcon={<AddIcon />}
        onActionClick={() => handleOpenForm()}
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