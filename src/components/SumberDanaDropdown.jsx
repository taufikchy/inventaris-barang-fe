import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const SumberDanaDropdown = ({ value, onChange, error, helperText, disabled = false }) => {
  const { currentUser } = useAuth();
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newSumberDana, setNewSumberDana] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showManageArea, setShowManageArea] = useState(false);

  const isKepalaLab = () => {
    return currentUser?.peran === 'kepala_lab';
  };

  const canViewSumberDana = () => {
    return currentUser?.peran === 'kepala_lab' || currentUser?.peran === 'admin' || currentUser?.peran === 'toolman';
  };

  const canManageSumberDana = () => {
    return currentUser?.peran === 'kepala_lab';
  };

  useEffect(() => {
    fetchSumberDana();
  }, []);

  const fetchSumberDana = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/api/sumber-dana');
      
      if (response.data.success) {
        setSumberDanaList(response.data.data);
      } else {
        setErrorState('Gagal memuat data sumber dana');
      }
    } catch (error) {
      console.error('Error fetching sumber dana:', error);
      setErrorState('Gagal memuat data sumber dana');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSumberDana = async () => {
    if (!newSumberDana.trim()) {
      toast.error('Nama sumber dana tidak boleh kosong');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axiosInstance.post('/api/sumber-dana', 
        { nama: newSumberDana.trim() }
      );

      if (response.data.success) {
        toast.success('Sumber dana berhasil ditambahkan');
        setNewSumberDana('');
        setOpenDialog(false);
        // Refresh data sumber dana
        await fetchSumberDana();
        // Set nilai yang baru ditambahkan sebagai pilihan
        onChange(response.data.data.id);
      } else {
        toast.error(response.data.message || 'Gagal menambahkan sumber dana');
      }
    } catch (error) {
      console.error('Error adding sumber dana:', error);
      toast.error('Gagal menambahkan sumber dana');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSumberDana('');
    setSaving(false);
  };

  const handleDeleteSumberDana = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      const response = await axiosInstance.delete(`/api/sumber-dana/${itemToDelete.id}`);

      if (response.data.success) {
        toast.success('Sumber dana berhasil dihapus');
        // Refresh data sumber dana
        await fetchSumberDana();
        // Reset value jika item yang dihapus sedang dipilih
        if (value === itemToDelete.id) {
          onChange('');
        }
      } else {
        toast.error(response.data.message || 'Gagal menghapus sumber dana');
      }
    } catch (error) {
      console.error('Error deleting sumber dana:', error);
      toast.error('Gagal menghapus sumber dana');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleOpenDeleteDialog = (item, event) => {
    event.stopPropagation();
    setItemToDelete(item);
    setDeleteDialog(true);
  }; if (loading) {
    return (
      <FormControl fullWidth disabled>
        <InputLabel>Memuat sumber dana...</InputLabel>
        <Select value="">
          <MenuItem value="">Memuat...</MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (errorState) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorState}
        </Alert>
        <FormControl fullWidth disabled>
          <InputLabel>Sumber Dana</InputLabel>
          <Select value="">
            <MenuItem value="">Error memuat data</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <FormControl fullWidth error={error} disabled={disabled}>
            <InputLabel id="sumber-dana-label">Sumber Dana</InputLabel>
            <Select
              labelId="sumber-dana-label"
              value={value || ''}
              label="Sumber Dana"
              onChange={(e) => onChange(e.target.value)}
            >
              <MenuItem value="">
                <em>Pilih Sumber Dana</em>
              </MenuItem>
              {sumberDanaList.map((sumberDana) => (
                <MenuItem key={sumberDana.id} value={sumberDana.id}>
                  {sumberDana.nama}
                </MenuItem>
              ))}
            </Select>
            {helperText && (
              <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ mt: 0.5, ml: 1.5 }}>
                {helperText}
              </Typography>
            )}
          </FormControl>

        </Box>
        
        {/* Tombol toggle untuk menampilkan area kelola */}
        {canManageSumberDana() && !disabled && sumberDanaList.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="medium"
              variant="outlined"
              onClick={() => setShowManageArea(!showManageArea)}
              sx={{ 
                fontSize: '0.875rem',
                py: 1,
                px: 2,
                color: 'primary.main',
                textTransform: 'none',
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                borderRadius: 1,
                minHeight: '40px',
                width: '100%',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  borderColor: 'primary.main'
                }
              }}
            >
              {showManageArea ? 'Sembunyikan Kelola' : 'Kelola Sumber Dana'}
            </Button>
          </Box>
        )}
        
        {/* Area untuk mengelola sumber dana yang sudah ada */}
        {canManageSumberDana() && !disabled && sumberDanaList.length > 0 && showManageArea && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: '#f3f8ff', 
            borderRadius: 2,
            border: '2px solid #e3f2fd',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="caption" sx={{ 
              mb: 1.5, 
              display: 'block', 
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Kelola Sumber Dana
            </Typography>
            
            {/* Tombol Tambah Sumber Dana */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setOpenDialog(true)}
              startIcon={<AddIcon />}
              sx={{
                mb: 2,
                fontSize: '0.75rem',
                textTransform: 'none',
                borderRadius: 1
              }}
            >
              Tambah Sumber Dana
            </Button>

            {/* Daftar Sumber Dana dengan Tombol Hapus */}
            {sumberDanaList.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Daftar Sumber Dana:
                </Typography>
                {sumberDanaList.map((sumberDana) => (
                  <Box
                    key={sumberDana.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      backgroundColor: 'white',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300',
                      '&:hover': {
                        borderColor: 'grey.400',
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', flex: 1 }}>
                      {sumberDana.nama}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleOpenDeleteDialog(sumberDana, e)}
                      sx={{
                        p: 0.5,
                        minWidth: 28,
                        height: 28,
                        ml: 1,
                        border: '1px solid',
                        borderColor: 'error.main',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'error.light',
                          borderColor: 'error.dark'
                        }
                      }}
                      title={`Hapus ${sumberDana.nama}`}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Dialog untuk menambah sumber dana baru */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Sumber Dana Baru</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nama Sumber Dana"
            fullWidth
            variant="outlined"
            value={newSumberDana}
            onChange={(e) => setNewSumberDana(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSumberDana();
              }
            }}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Batal
          </Button>
          <Button 
            onClick={handleAddSumberDana} 
            variant="contained" 
            disabled={saving || !newSumberDana.trim()}
          >
            {saving ? 'Menyimpan...' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog konfirmasi hapus */}
      <Dialog open={deleteDialog} onClose={() => !deleting && setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus sumber dana "{itemToDelete?.nama}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={deleting}>
            Batal
          </Button>
          <Button 
            onClick={handleDeleteSumberDana} 
            variant="contained" 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SumberDanaDropdown;