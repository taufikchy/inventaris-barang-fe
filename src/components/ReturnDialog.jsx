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
        sx: { minHeight: { xs: '500px', sm: '600px' } }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        padding: { xs: '12px 16px', sm: '16px 24px' }
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ReturnIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          <Typography variant="h6" sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Pengembalian Barang
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{
        padding: { xs: '8px 16px', sm: '16px 24px' }
      }}>
        {/* Informasi Peminjaman */}
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: { xs: 2, sm: 3 }, 
          bgcolor: 'grey.50' 
        }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{
            fontSize: { xs: '1rem', sm: '1.125rem' }
          }}>
            Informasi Peminjaman
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Kode Peminjaman
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {peminjaman?.kode || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Nama Peminjam
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {peminjaman?.nama_peminjam || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Tanggal Pinjam
              </Typography>
              <Typography variant="body1" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {formatDate(peminjaman?.tanggal_pinjam)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Tanggal Kembali Harapan
              </Typography>
              <Typography variant="body1" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {formatDate(peminjaman?.tanggal_kembali_harapan)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Detail Barang */}
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          gutterBottom
          sx={{
            fontSize: {
              xs: '1rem',
              sm: '1.1rem',
              md: '1.25rem'
            }
          }}
        >
          Detail Kondisi Barang
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    md: '1rem'
                  },
                  padding: {
                    xs: '8px 4px',
                    sm: '12px 8px',
                    md: '16px'
                  }
                }}>Nama Barang</TableCell>
                <TableCell align="center" sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    md: '1rem'
                  },
                  padding: {
                    xs: '8px 4px',
                    sm: '12px 8px',
                    md: '16px'
                  }
                }}>Jumlah</TableCell>
                <TableCell align="center" sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    md: '1rem'
                  },
                  padding: {
                    xs: '8px 4px',
                    sm: '12px 8px',
                    md: '16px'
                  }
                }}>Kondisi Saat Pinjam</TableCell>
                <TableCell align="center" sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    md: '1rem'
                  },
                  padding: {
                    xs: '8px 4px',
                    sm: '12px 8px',
                    md: '16px'
                  }
                }}>Kondisi Saat Kembali</TableCell>
                <TableCell sx={{
                  fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    md: '1rem'
                  },
                  padding: {
                    xs: '8px 4px',
                    sm: '12px 8px',
                    md: '16px'
                  }
                }}>Catatan Kondisi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnData.detail_kondisi.map((detail, index) => (
                <TableRow key={detail.id_detail}>
                  <TableCell sx={{
                    padding: {
                      xs: '8px 4px',
                      sm: '12px 8px',
                      md: '16px'
                    }
                  }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{
                        fontSize: {
                          xs: '0.75rem',
                          sm: '0.875rem',
                          md: '1rem'
                        }
                      }}
                    >
                      {detail.nama_barang}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{
                    padding: {
                      xs: '8px 4px',
                      sm: '12px 8px',
                      md: '16px'
                    }
                  }}>
                    <Chip 
                      label={detail.jumlah} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ 
                        fontSize: {
                          xs: '0.7rem',
                          sm: '0.8rem',
                          md: '0.875rem'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{
                    padding: {
                      xs: '8px 4px',
                      sm: '12px 8px',
                      md: '16px'
                    }
                  }}>
                    <Chip 
                      label={getKondisiLabel(detail.kondisi_saat_pinjam)}
                      size="small"
                      color={getKondisiColor(detail.kondisi_saat_pinjam)}
                      variant="outlined"
                      sx={{ 
                        fontSize: {
                          xs: '0.7rem',
                          sm: '0.8rem',
                          md: '0.875rem'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{
                    padding: {
                      xs: '8px 4px',
                      sm: '12px 8px',
                      md: '16px'
                    }
                  }}>
                    <FormControl size="small" sx={{ 
                      minWidth: {
                        xs: 100,
                        sm: 120,
                        md: 140
                      }
                    }}>
                      <Select
                        value={detail.kondisi_saat_kembali}
                        onChange={(e) => handleDetailKondisiChange(index, 'kondisi_saat_kembali', e.target.value)}
                        variant="outlined"
                        sx={{
                          fontSize: {
                            xs: '0.75rem',
                            sm: '0.875rem',
                            md: '1rem'
                          }
                        }}
                      >
                        <MenuItem value="baik">Baik</MenuItem>
                        <MenuItem value="rusak_ringan">Rusak Ringan</MenuItem>
                        <MenuItem value="rusak_berat">Rusak Berat</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{
                    padding: {
                      xs: '8px 4px',
                      sm: '12px 8px',
                      md: '16px'
                    }
                  }}>
                    <TextField
                      size="small"
                      placeholder="Catatan kondisi..."
                      value={detail.catatan_kondisi}
                      onChange={(e) => handleDetailKondisiChange(index, 'catatan_kondisi', e.target.value)}
                      required={detail.kondisi_saat_kembali === 'rusak_ringan' || detail.kondisi_saat_kembali === 'rusak_berat'}
                      error={(detail.kondisi_saat_kembali === 'rusak_ringan' || detail.kondisi_saat_kembali === 'rusak_berat') && !detail.catatan_kondisi.trim()}
                      sx={{ 
                        minWidth: {
                          xs: 120,
                          sm: 150,
                          md: 180
                        },
                        '& .MuiInputBase-input': {
                          fontSize: {
                            xs: '0.75rem',
                            sm: '0.875rem',
                            md: '1rem'
                          }
                        }
                      }}
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
          sx={{
            '& .MuiInputBase-input': {
              fontSize: {
                xs: '0.875rem',
                sm: '1rem'
              }
            },
            '& .MuiInputLabel-root': {
              fontSize: {
                xs: '0.875rem',
                sm: '1rem'
              }
            },
            '& .MuiFormHelperText-root': {
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem'
              }
            }
          }}
        />
      </DialogContent>
      
      <DialogActions sx={{ 
        p: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            fontSize: {
              xs: '0.875rem',
              sm: '1rem'
            }
          }}
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
            width: { xs: '100%', sm: 'auto' },
            color: 'white',
            fontSize: {
              xs: '0.875rem',
              sm: '1rem'
            },
            '& .MuiSvgIcon-root': {
              color: 'white',
              fontSize: {
                xs: '1rem',
                sm: '1.25rem'
              }
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