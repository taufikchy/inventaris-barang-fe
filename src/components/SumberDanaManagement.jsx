import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const SumberDanaManagement = () => {
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSumberDana, setSelectedSumberDana] = useState(null);
  const [formData, setFormData] = useState({ nama: '' });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSumberDana();
  }, []);

  const fetchSumberDana = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sumber-dana', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSumberDanaList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sumber dana:', error);
      showSnackbar('Gagal memuat data sumber dana', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (sumberDana = null) => {
    if (sumberDana) {
      setEditMode(true);
      setSelectedSumberDana(sumberDana);
      setFormData({ nama: sumberDana.nama });
    } else {
      setEditMode(false);
      setSelectedSumberDana(null);
      setFormData({ nama: '' });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ nama: '' });
    setErrors({});
    setSelectedSumberDana(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama sumber dana harus diisi';
    } else if (formData.nama.trim().length < 3) {
      newErrors.nama = 'Nama sumber dana minimal 3 karakter';
    } else if (formData.nama.trim().length > 255) {
      newErrors.nama = 'Nama sumber dana maksimal 255 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (editMode) {
        await axios.put(
          `/api/sumber-dana/${selectedSumberDana.id}`,
          formData,
          config
        );
        showSnackbar('Sumber dana berhasil diperbarui');
      } else {
        await axios.post(
          '/api/sumber-dana',
          formData,
          config
        );
        showSnackbar('Sumber dana berhasil ditambahkan');
      }

      handleCloseDialog();
      fetchSumberDana();
    } catch (error) {
      console.error('Error saving sumber dana:', error);
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.path] = err.msg;
        });
        setErrors(serverErrors);
      } else {
        showSnackbar(
          error.response?.data?.message || 'Gagal menyimpan sumber dana',
          'error'
        );
      }
    }
  };

  const handleDelete = async (sumberDana) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus sumber dana "${sumberDana.nama}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/sumber-dana/${sumberDana.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      showSnackbar('Sumber dana berhasil dihapus');
      fetchSumberDana();
    } catch (error) {
      console.error('Error deleting sumber dana:', error);
      showSnackbar(
        error.response?.data?.message || 'Gagal menghapus sumber dana',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Memuat data sumber dana...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Manajemen Sumber Dana
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Tambah Sumber Dana
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nama Sumber Dana</TableCell>
              <TableCell>Tanggal Dibuat</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sumberDanaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Belum ada data sumber dana
                </TableCell>
              </TableRow>
            ) : (
              sumberDanaList.map((sumberDana) => (
                <TableRow key={sumberDana.id}>
                  <TableCell>{sumberDana.id}</TableCell>
                  <TableCell>{sumberDana.nama}</TableCell>
                  <TableCell>
                    {new Date(sumberDana.createdAt).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(sumberDana)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(sumberDana)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog untuk tambah/edit sumber dana */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nama"
            label="Nama Sumber Dana"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nama}
            onChange={handleInputChange}
            error={!!errors.nama}
            helperText={errors.nama}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Perbarui' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar untuk notifikasi */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SumberDanaManagement;