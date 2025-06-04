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

// Validation schema for lokasi form
const LokasiSchema = Yup.object().shape({
  nama: Yup.string().required('Nama lokasi harus diisi'),
  deskripsi: Yup.string(),
});

const Lokasi = () => {
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
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData = [
        { id: 1, nama: 'Lab Komputer 1', deskripsi: 'Laboratorium komputer lantai 1' },
        { id: 2, nama: 'Lab Komputer 2', deskripsi: 'Laboratorium komputer lantai 2' },
        { id: 3, nama: 'Lab Jaringan', deskripsi: 'Laboratorium jaringan komputer' },
        { id: 4, nama: 'Ruang Server', deskripsi: 'Ruang server utama' },
        { id: 5, nama: 'Ruang Guru', deskripsi: 'Ruang guru TKJ' },
        { id: 6, nama: 'Gudang', deskripsi: 'Gudang penyimpanan peralatan' },
      ];
      
      setLokasis(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lokasis:', error);
      toast.error('Gagal memuat data lokasi');
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
      // In a real application, you would send this data to your API
      console.log('Submitting lokasi:', values);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentLokasi) {
        // Update existing lokasi
        const updatedLokasis = lokasis.map(l =>
          l.id === currentLokasi.id ? { ...values, id: currentLokasi.id } : l
        );
        setLokasis(updatedLokasis);
        toast.success('Lokasi berhasil diperbarui');
      } else {
        // Add new lokasi
        const newLokasi = {
          ...values,
          id: Math.max(0, ...lokasis.map(l => l.id)) + 1,
        };
        setLokasis([...lokasis, newLokasi]);
        toast.success('Lokasi berhasil ditambahkan');
      }
      
      resetForm();
      handleCloseForm();
    } catch (error) {
      console.error('Error submitting lokasi:', error);
      toast.error('Gagal menyimpan lokasi');
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
      
      // In a real application, you would send this request to your API
      console.log('Deleting lokasi:', currentLokasi);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from state
      setLokasis(lokasis.filter(l => l.id !== currentLokasi.id));
      toast.success('Lokasi berhasil dihapus');
      
      setConfirmDelete(false);
      setCurrentLokasi(null);
    } catch (error) {
      console.error('Error deleting lokasi:', error);
      toast.error('Gagal menghapus lokasi');
    } finally {
      setDeleteLoading(false);
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
        title="Lokasi Barang"
        actionText="Tambah Lokasi"
        actionIcon={<AddIcon />}
        onActionClick={() => handleOpenForm()}
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