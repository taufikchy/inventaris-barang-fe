import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import useStockNotification from '../hooks/useStockNotification';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Autocomplete,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

// Validation schema for transaksi form
const TransaksiSchema = Yup.object().shape({
  id_barang: Yup.number().required('Barang wajib dipilih'),
  jenis_transaksi: Yup.string().oneOf(['masuk', 'keluar', 'rusak', 'hilang'], 'Jenis transaksi tidak valid').required('Jenis transaksi wajib dipilih'),
  jumlah: Yup.number()
    .required('Jumlah wajib diisi')
    .min(1, 'Jumlah minimal 1')
    .integer('Jumlah harus berupa bilangan bulat'),
  keterangan: Yup.string().required('Keterangan wajib diisi'),
});

const TransaksiInventaris = () => {
  const { user, isAdminToolmanOrKepalaLab, canCreateTransaction, canDeleteTransaction } = useAuth();
  const { checkStockLevels } = useStockNotification();
  const [loading, setLoading] = useState(true);
  const [transaksis, setTransaksis] = useState([]);
  const [barangs, setBarangs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTransaksi, setViewingTransaksi] = useState(null);

  // Fetch data
  const fetchTransaksis = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/transaksi');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setTransaksis(response.data.data);
      } else {
        console.warn('Invalid response format for transaksis:', response.data);
        setTransaksis([]);
      }
    } catch (error) {
      console.error('Error fetching transaksis:', error);
      setTransaksis([]);
      if (error.response?.status !== 401) {
        toast.error('Gagal memuat data transaksi');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBarangs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/barang/dropdown', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data && response.data.sukses && Array.isArray(response.data.data)) {
        // Filter hanya barang dengan kategori tipe 'bahan'
        const barangBahan = response.data.data.filter(barang => 
          barang && barang.kategori && barang.kategori.tipe === 'bahan'
        );
        setBarangs(barangBahan);
      } else {
        console.warn('Invalid response format for barangs:', response.data);
        setBarangs([]);
      }
    } catch (error) {
      console.error('Error fetching barangs:', error);
      setBarangs([]);
      if (error.response?.status !== 401) {
        toast.error('Gagal memuat data barang');
      }
    }
  };

  useEffect(() => {
    fetchTransaksis();
    fetchBarangs();
  }, []);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setSaving(true);
      
      const formattedValues = {
        ...values,
        id_pengguna: user?.id,
        tanggal_transaksi: new Date().toISOString(),
        status: 'approved'
      };
      
      const response = await axios.post('/api/transaksi', formattedValues);
      
      if (response.data.success) {
        // Check if item was auto-deleted
        if (response.data.itemDeleted && response.data.deletedItemName) {
          toast.success(
            `Transaksi berhasil dibuat. Barang "${response.data.deletedItemName}" telah dihapus otomatis karena stok mencapai 0.`,
            {
              autoClose: 5000, // Show longer for important message
              style: {
                backgroundColor: '#ffffff',
                color: '#000000',
                fontWeight: '500',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }
            }
          );
        } else {
          toast.success('Transaksi berhasil ditambahkan');
        }
        
        setDialogOpen(false);
        resetForm();
        fetchTransaksis();
        
        // Refresh barang data to show updated stock
        fetchBarangs();
        
        // Dispatch custom event to notify other components about inventory change
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
          detail: {
            type: 'transaction',
            action: 'create',
            itemDeleted: response.data.itemDeleted,
            deletedItemName: response.data.deletedItemName
          }
        }));
        
        // Check stock levels after transaction to trigger notifications if needed
        setTimeout(() => {
          checkStockLevels();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving transaksi:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };



  // Handle delete transaksi
  const handleDelete = async (id) => {
    if (!id) {
      toast.error('ID transaksi tidak valid');
      return;
    }
    
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const response = await axios.delete(`/api/transaksi/${id}`);
        if (response.data && response.data.success) {
          toast.success('Transaksi berhasil dihapus');
          fetchTransaksis();
          
          // Refresh barang data to show updated stock
          fetchBarangs();
          
          // Dispatch custom event to notify other components about inventory change
          window.dispatchEvent(new CustomEvent('inventoryUpdated', {
            detail: {
              type: 'transaction',
              action: 'delete'
            }
          }));
          
          // Check stock levels after deletion
          setTimeout(() => {
            checkStockLevels();
          }, 1000);
        } else {
          toast.error(response.data?.message || 'Gagal menghapus transaksi');
        }
      } catch (error) {
        console.error('Error deleting transaksi:', error);
        const errorMessage = error.response?.data?.message || 'Gagal menghapus transaksi';
        toast.error(errorMessage);
      }
    }
  };

  // Handle view transaksi
  const handleView = (transaksi) => {
    setViewingTransaksi(transaksi);
    setViewDialogOpen(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'masuk':
        return 'success';
      case 'keluar':
        return 'primary';
      case 'rusak':
        return 'warning';
      case 'hilang':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format stock display for transaction history
  const formatStockDisplay = (stockValue, barang) => {
    if (!barang || stockValue === null || stockValue === undefined) {
      return '-';
    }

    // For 'bahan' category with 'set' unit, show total available units
    if (barang.kategori?.tipe === 'bahan' && barang.satuan === 'set' && barang.unit_per_set) {
      // stockValue represents total available units
      const sets = Math.floor(stockValue / barang.unit_per_set);
      const remainingUnits = stockValue % barang.unit_per_set;
      if (remainingUnits === 0) {
        return `${sets} set (${stockValue} unit)`;
      } else {
        return `${sets} set + ${remainingUnits} unit (${stockValue} unit)`;
      }
    }

    // For other cases, show stock with unit
    return `${stockValue} ${barang.satuan || ''}`;
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'masuk':
        return 'Masuk';
      case 'keluar':
        return 'Keluar';
      case 'rusak':
        return 'Rusak';
      case 'hilang':
        return 'Hilang';
      default:
        return type;
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Persetujuan';
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  };

  // Table columns
  const columns = [
    {
      id: 'tanggal_transaksi',
      label: 'Tanggal',
      sortable: true,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.4 }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      id: 'barang',
      label: 'Barang',
      sortable: true,
      minWidth: 160,
      format: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, margin: 0, padding: 0, lineHeight: 1.4 }}>
            {value?.nama || '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.2 }}>
            {value?.kode || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'jenis_transaksi',
      label: 'Jenis',
      sortable: true,
      align: 'center',
      minWidth: 80,
      format: (value) => (
        <Chip
          label={getTransactionTypeLabel(value)}
          color={getTransactionTypeColor(value)}
          size="small"
          sx={{ 
            color: 'white',
            fontWeight: 500,
            minWidth: 60
          }}
        />
      ),
    },
    {
      id: 'jumlah',
      label: 'Jumlah',
      sortable: true,
      align: 'right',
      minWidth: 80,
      format: (value, row) => {
        if (!row.barang || value === null || value === undefined) {
          return (
            <Typography variant="body2" color="text.secondary" sx={{ margin: 0, padding: 0, lineHeight: 1.4 }}>
              -
            </Typography>
          );
        }
        // For 'bahan' category with 'set' unit, show units
        const displayValue = row.barang.kategori?.tipe === 'bahan' && row.barang.satuan === 'set' 
          ? `${value} unit`
          : `${value} ${row.barang.satuan || ''}`;
        
        return (
          <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.4 }}>
            {displayValue}
          </Typography>
        );
      },
    },
    {
      id: 'stok_sebelum',
      label: 'Stok Sebelum',
      sortable: true,
      align: 'right',
      minWidth: 100,
      format: (value, row) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: value === 0 ? 'error.main' : 'text.primary',
            margin: 0,
            padding: 0,
            lineHeight: 1.4
          }}
        >
          {formatStockDisplay(value, row.barang)}
        </Typography>
      ),
    },
    {
      id: 'stok_sesudah',
      label: 'Stok Sesudah',
      sortable: true,
      align: 'right',
      minWidth: 100,
      format: (value, row) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: value === 0 ? 'error.main' : value < 10 ? 'warning.main' : 'success.main',
            margin: 0,
            padding: 0,
            lineHeight: 1.4
          }}
        >
          {formatStockDisplay(value, row.barang)}
        </Typography>
      ),
    },
    {
      id: 'keterangan',
      label: 'Keterangan',
      sortable: true,
      minWidth: 120,
      format: (value) => (
        <Typography 
          variant="body2" 
          sx={{ 
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
            padding: 0,
            lineHeight: 1.4
          }}
          title={value || '-'}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      sortable: true,
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500, margin: 0, padding: 0, lineHeight: 1.4 }}>
          {value?.nama || '-'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'center',
      minWidth: 140,
      format: (value, row) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<ViewIcon />}
            onClick={() => handleView(row)}
            sx={{ minWidth: 60, fontSize: '0.75rem' }}
          >
            Lihat
          </Button>
          {canDeleteTransaction() && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete(row.id)}
              sx={{ minWidth: 60, fontSize: '0.75rem' }}
            >
              Hapus
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Transaksi Inventaris"
        subtitle="Kelola transaksi masuk, keluar, rusak, dan hilang untuk barang kategori bahan. Untuk kategori alat, gunakan sistem peminjaman."
        actions={canCreateTransaction() ? [
          {
            label: 'Tambah Transaksi',
            icon: <AddIcon />,
            onClick: () => setDialogOpen(true),
            variant: 'contained',
          },
        ] : []}
      />

      <DataTable
        columns={columns}
        rows={transaksis}
        loading={loading}
        refreshable
        onRefresh={fetchTransaksis}
        emptyMessage="Tidak ada data transaksi"
        initialOrderBy="tanggal_transaksi"
        initialOrder="desc"
      />

      {/* Dialog Form */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tambah Transaksi Inventaris
        </DialogTitle>
        <Formik
          initialValues={{
            id_barang: '',
            jenis_transaksi: '',
            jumlah: 1,
            keterangan: '',
          }}
          validationSchema={TransaksiSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, handleChange, setFieldValue, isSubmitting }) => {
            const selectedBarang = barangs.find(b => b.id === values.id_barang);
            
            return (
              <Form>
                <DialogContent>
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #1976d2' }}>
                    <Typography variant="body2" color="#0d47a1" sx={{ fontWeight: 500 }}>
                      <strong>Informasi:</strong> Transaksi inventaris hanya dapat dilakukan untuk barang kategori <strong>bahan</strong>. 
                      Untuk kategori alat, silakan gunakan sistem peminjaman.
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={barangs}
                        getOptionLabel={(option) => `${option.kode} - ${option.nama}`}
                        value={selectedBarang || null}
                        onChange={(_, newValue) => {
                          setFieldValue('id_barang', newValue?.id || '');
                        }}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box component="li" key={key} {...otherProps}>
                              <Box>
                                <Typography variant="body2">
                                  {option.kode} - {option.nama}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Stok: {option.jumlah} {option.satuan} | Kategori: {option.kategori?.nama}
                                  {option.kategori?.tipe === 'bahan' && (
                                    <Chip
                                      label="Bahan"
                                      size="small"
                                      color="primary"
                                      sx={{ ml: 1, fontSize: '0.7rem', color: 'white' }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Pilih Barang"
                            fullWidth
                            required
                            error={touched.id_barang && Boolean(errors.id_barang)}
                            helperText={touched.id_barang && errors.id_barang}
                          />
                        )}
                      />
                    </Grid>
                    
                    {selectedBarang && (
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Stok Saat Ini: {selectedBarang.jumlah} {selectedBarang.satuan}
                              {selectedBarang.satuan === 'set' && selectedBarang.unit_per_set && (
                                <span>
                                  {(() => {
                                    const totalUnits = selectedBarang.jumlah * selectedBarang.unit_per_set;
                                    const usedUnits = selectedBarang.unit_used || 0;
                                    const availableUnits = totalUnits - usedUnits;
                                    return ` (${availableUnits} unit tersedia dari ${totalUnits} unit total)`;
                                  })()} 
                                  {selectedBarang.unit_used > 0 && (
                                    <span style={{ color: '#ff9800' }}> - {selectedBarang.unit_used} unit terpakai</span>
                                  )}
                                </span>
                              )}
                            </Typography>
                            {selectedBarang.kategori?.tipe === 'bahan' && (
                              <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic', display: 'block' }}>
                                * Bahan dapat digunakan sebagian - stok akan berkurang sesuai jumlah yang digunakan
                                {selectedBarang.satuan === 'set' && selectedBarang.unit_per_set && (
                                  <span><br/>* 1 set = {selectedBarang.unit_per_set} unit</span>
                                )}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Jenis Transaksi"
                        name="jenis_transaksi"
                        value={values.jenis_transaksi}
                        onChange={handleChange}
                        required
                        error={touched.jenis_transaksi && Boolean(errors.jenis_transaksi)}
                        helperText={touched.jenis_transaksi && errors.jenis_transaksi}
                      >
                        <MenuItem value="keluar">Keluar (Dipakai Praktik)</MenuItem>
                        <MenuItem value="rusak">Rusak</MenuItem>
                        <MenuItem value="hilang">Hilang</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={selectedBarang?.satuan === 'set' ? 'Jumlah (dalam unit)' : 'Jumlah'}
                        name="jumlah"
                        type="number"
                        value={values.jumlah}
                        onChange={handleChange}
                        required
                        InputProps={{
                          inputProps: {
                            min: 1,
                            max: values.jenis_transaksi === 'keluar' ? 
                              (selectedBarang?.satuan === 'set' && selectedBarang?.unit_per_set ? 
                                (() => {
                                  const totalUnits = selectedBarang.jumlah * selectedBarang.unit_per_set;
                                  const usedUnits = selectedBarang.unit_used || 0;
                                  return totalUnits - usedUnits;
                                })() : 
                                selectedBarang?.jumlah) : 
                              undefined
                          }
                        }}
                        error={touched.jumlah && Boolean(errors.jumlah)}
                        helperText={
                          touched.jumlah && errors.jumlah ? errors.jumlah :
                          (selectedBarang?.satuan === 'set' && selectedBarang?.unit_per_set && values.jenis_transaksi === 'keluar' ? 
                            (() => {
                              const totalUnits = selectedBarang.jumlah * selectedBarang.unit_per_set;
                              const usedUnits = selectedBarang.unit_used || 0;
                              const availableUnits = totalUnits - usedUnits;
                              return `Maksimal ${availableUnits} unit tersedia (dari ${selectedBarang.jumlah} set, ${usedUnits} unit terpakai)`;
                            })() : 
                            (touched.jumlah && errors.jumlah))
                        }
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Keterangan"
                        name="keterangan"
                        value={values.keterangan}
                        onChange={handleChange}
                        required
                        multiline
                        rows={2}
                        error={touched.keterangan && Boolean(errors.keterangan)}
                        helperText={touched.keterangan && errors.keterangan}
                      />
                    </Grid>

                    {values.jenis_transaksi === 'masuk' && (
                      <>

                      </>
                    )}
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog} color="secondary">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || saving}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detail Transaksi</DialogTitle>
        <DialogContent>
          {viewingTransaksi && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Tanggal Transaksi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatDate(viewingTransaksi.tanggal_transaksi)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Jenis Transaksi
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getTransactionTypeLabel(viewingTransaksi.jenis_transaksi)}
                      color={getTransactionTypeColor(viewingTransaksi.jenis_transaksi)}
                      size="small"
                      sx={{ color: 'white', fontWeight: 500 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Barang
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingTransaksi.barang?.nama || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Jumlah
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingTransaksi.barang?.kategori?.tipe === 'bahan' && viewingTransaksi.barang?.satuan === 'set' 
                      ? `${viewingTransaksi.jumlah} unit`
                      : `${viewingTransaksi.jumlah} ${viewingTransaksi.barang?.satuan || ''}`
                    }
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Stok Sebelum
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatStockDisplay(viewingTransaksi.stok_sebelum, viewingTransaksi.barang)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Stok Sesudah
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatStockDisplay(viewingTransaksi.stok_sesudah, viewingTransaksi.barang)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Sukses
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Pengguna
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingTransaksi.pengguna?.nama || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Keterangan
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingTransaksi.keterangan || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} color="primary">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransaksiInventaris;