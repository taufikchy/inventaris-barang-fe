import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid
} from '@mui/material';
import { AssignmentReturn as ReturnIcon } from '@mui/icons-material';

const ReturnDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  loading, 
  peminjaman 
}) => {
  const [returnData, setReturnData] = useState({
    catatan: '',
    detail_kondisi: []
  });

  const [errors, setErrors] = useState({});

  // Initialize detail kondisi when dialog opens
  React.useEffect(() => {
    if (open && peminjaman?.detail_peminjaman) {
      const initialDetailKondisi = peminjaman.detail_peminjaman.map(detail => ({
        id_detail: detail.id,
        nama_barang: detail.barang?.nama || 'Unknown',
        jumlah: detail.jumlah,
        kondisi_saat_pinjam: detail.kondisi_saat_pinjam || 'baik',
        kondisi_saat_kembali: detail.kondisi_saat_kembali || 'baik',
        catatan_kondisi: ''
      }));
      
      setReturnData(prev => ({
        ...prev,
        detail_kondisi: initialDetailKondisi
      }));
    }
  }, [open, peminjaman]);

  const handleInputChange = (field, value) => {
    setReturnData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDetailKondisiChange = (index, field, value) => {
    setReturnData(prev => ({
      ...prev,
      detail_kondisi: prev.detail_kondisi.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!returnData.catatan.trim()) {
      newErrors.catatan = 'Catatan pengembalian wajib diisi';
    }
    
    // Validate detail kondisi
    const hasInvalidKondisi = returnData.detail_kondisi.some(detail => 
      (detail.kondisi_saat_kembali === 'rusak_ringan' || detail.kondisi_saat_kembali === 'rusak_berat') && !detail.catatan_kondisi.trim()
    );
    
    if (hasInvalidKondisi) {
      newErrors.detail_kondisi = 'Catatan kondisi wajib diisi untuk barang yang rusak ringan atau rusak berat';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(returnData);
    }
  };

  const handleClose = () => {
    setReturnData({
      catatan: '',
      detail_kondisi: []
    });
    setErrors({});
    onClose();
  };

  const getKondisiColor = (kondisi) => {
    switch (kondisi) {
      case 'baik': return 'success';
      case 'rusak_ringan': return 'warning';
      case 'rusak_berat': return 'error';
      default: return 'default';
    }
  };

  const getKondisiLabel = (kondisi) => {
    switch (kondisi) {
      case 'baik': return 'Baik';
      case 'rusak_ringan': return 'Rusak Ringan';
      case 'rusak_berat': return 'Rusak Berat';
      default: return kondisi;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ReturnIcon color="primary" />
          <Typography variant="h6">
            Pengembalian Barang
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Informasi Peminjaman */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Informasi Peminjaman
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Kode Peminjaman
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {peminjaman?.kode || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Nama Peminjam
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {peminjaman?.nama_peminjam || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Tanggal Pinjam
              </Typography>
              <Typography variant="body1">
                {formatDate(peminjaman?.tanggal_pinjam)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Tanggal Kembali Harapan
              </Typography>
              <Typography variant="body1">
                {formatDate(peminjaman?.tanggal_kembali_harapan)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Detail Barang */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Detail Kondisi Barang
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nama Barang</TableCell>
                <TableCell align="center">Jumlah</TableCell>
                <TableCell align="center">Kondisi Saat Pinjam</TableCell>
                <TableCell align="center">Kondisi Saat Kembali</TableCell>
                <TableCell>Catatan Kondisi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnData.detail_kondisi.map((detail, index) => (
                <TableRow key={detail.id_detail}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {detail.nama_barang}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={detail.jumlah} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ color: 'white' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getKondisiLabel(detail.kondisi_saat_pinjam)}
                      size="small"
                      color={getKondisiColor(detail.kondisi_saat_pinjam)}
                      variant="outlined"
                      sx={{ color: 'white' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={detail.kondisi_saat_kembali}
                        onChange={(e) => handleDetailKondisiChange(index, 'kondisi_saat_kembali', e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="baik">Baik</MenuItem>
                        <MenuItem value="rusak_ringan">Rusak Ringan</MenuItem>
                        <MenuItem value="rusak_berat">Rusak Berat</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Catatan kondisi..."
                      value={detail.catatan_kondisi}
                      onChange={(e) => handleDetailKondisiChange(index, 'catatan_kondisi', e.target.value)}
                      required={detail.kondisi_saat_kembali === 'rusak_ringan' || detail.kondisi_saat_kembali === 'rusak_berat'}
                      error={(detail.kondisi_saat_kembali === 'rusak_ringan' || detail.kondisi_saat_kembali === 'rusak_berat') && !detail.catatan_kondisi.trim()}
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {errors.detail_kondisi && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {errors.detail_kondisi}
          </Typography>
        )}

        {/* Catatan Pengembalian */}
        <TextField
          fullWidth
          label="Catatan Pengembalian"
          multiline
          rows={3}
          value={returnData.catatan}
          onChange={(e) => handleInputChange('catatan', e.target.value)}
          placeholder="Masukkan catatan pengembalian umum..."
          required
          error={!!errors.catatan}
          helperText={errors.catatan}
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          color="success"
          startIcon={<ReturnIcon />}
          sx={{
            color: 'white',
            '& .MuiSvgIcon-root': {
              color: 'white'
            }
          }}
        >
          {loading ? 'Memproses...' : 'Kembalikan Barang'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnDialog;