import { useState, useEffect } from 'react';
import axios from '../utils/axios';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';

// Validation schema for user form
const UserSchema = Yup.object().shape({
  nama: Yup.string().required('Nama pengguna harus diisi'),
  nama_pengguna: Yup.string()
    .min(4, 'Username minimal 4 karakter')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore')
    .required('Username harus diisi'),
  kata_sandi: Yup.string()
    .when('$isEditing', {
      is: false,
      then: (schema) => schema.required('Password harus diisi'),
      otherwise: (schema) => schema,
    }),
  peran: Yup.string().required('Role harus dipilih'),
});

const Pengguna = () => {
  const { isAdminOrToolman, isKepalaLab, isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    halaman: 1,
    batas: 10,
    total: 0,
    total_halaman: 1,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch users data
  const fetchUsers = async (page = pagination.halaman, limit = pagination.batas, search = searchTerm, role = null) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pengguna', {
        params: {
          halaman: page,
          batas: limit,
          cari: search,
          peran: role,
        },
      });
      if (response.data.sukses) {
        console.log('Fetched users data:', response.data.data);
        console.log('Pagination data:', response.data.pagination);
        
        // Periksa struktur data untuk debugging
        if (response.data.data && response.data.data.length > 0) {
          console.log('Sample user data structure:', response.data.data[0]);
          console.log('Username:', response.data.data[0].username);
          console.log('Role:', response.data.data[0].role);
        }
        
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.pesan || 'Gagal memuat data pengguna');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.pesan || 'Terjadi kesalahan saat memuat data pengguna');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      let roleToFetch = '';
      if (isAdmin()) {
        roleToFetch = 'admin'; // Admin sees only admin roles by default
      } else if (isKepalaLab()) {
        roleToFetch = ''; // Kepala Lab sees all roles
      } else if (user.peran === 'toolman') {
        roleToFetch = 'toolman';
      } else if (user.peran === 'sarana') {
        roleToFetch = 'sarana';
      }
      setSelectedRole(roleToFetch);
      fetchUsers(pagination.halaman, pagination.batas, searchTerm, roleToFetch);
    }
  }, [pagination.halaman, pagination.batas, searchTerm, user]);

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, halaman: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination((prev) => ({ ...prev, batas: parseInt(event.target.value, 10), halaman: 1 }));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPagination((prev) => ({ ...prev, halaman: 1 })); // Reset to first page on search
  };

  const handleRoleFilterChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);
    setPagination((prev) => ({ ...prev, halaman: 1 })); // Reset to first page on role filter change
    fetchUsers(1, pagination.batas, searchTerm, newRole);
  };

  // Handle form open for add/edit
  const handleOpenForm = (user = null) => {
    setCurrentUser(user);
    setOpenForm(true);
  };

  // Handle form close
  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentUser(null);
    setShowPassword(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      let response;
      if (currentUser) {
        // Update existing user
        response = await axios.put(`/api/pengguna/${currentUser.id}`, values);
        if (response.data.sukses) {
          toast.success('Pengguna berhasil diperbarui');
        } else {
          toast.error(response.data.pesan || 'Gagal memperbarui pengguna');
        }
      } else {
        // Add new user
        response = await axios.post('/api/pengguna', values);
        if (response.data.sukses) {
          toast.success('Pengguna berhasil ditambahkan');
        } else {
          toast.error(response.data.pesan || 'Gagal menambahkan pengguna');
        }
      }
      
      if (response.data.sukses) {
        fetchUsers(pagination.halaman, pagination.batas, searchTerm); // Refresh data
        resetForm();
        handleCloseForm();
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      toast.error(error.response?.data?.pesan || 'Terjadi kesalahan saat menyimpan pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (user) => {
    setCurrentUser(user);
    setConfirmDelete(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axios.delete(`/api/pengguna/${currentUser.id}`);
      if (response.data.sukses) {
        toast.success('Pengguna berhasil dihapus');
        fetchUsers(pagination.halaman, pagination.batas, searchTerm); // Refresh data
      } else {
        toast.error(response.data.pesan || 'Gagal menghapus pengguna');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.pesan || 'Terjadi kesalahan saat menghapus pengguna');
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
      setCurrentUser(null);
    }
  };

  // Handle deactivate user
  const handleDeactivate = async (user) => {
    try {
      const response = await axios.patch(`/api/pengguna/${user.id}/nonaktifkan`);
      if (response.data.sukses) {
        toast.success('Pengguna berhasil dinonaktifkan');
        fetchUsers(pagination.halaman, pagination.batas, searchTerm); // Refresh data
      } else {
        toast.error(response.data.pesan || 'Gagal menonaktifkan pengguna');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error(error.response?.data?.pesan || 'Terjadi kesalahan saat menonaktifkan pengguna');
    }
  };

  // Handle activate user
  const handleActivate = async (user) => {
    try {
      const response = await axios.patch(`/api/pengguna/${user.id}/aktifkan`);
      if (response.data.sukses) {
        toast.success('Pengguna berhasil diaktifkan');
        fetchUsers(pagination.halaman, pagination.batas, searchTerm); // Refresh data
      } else {
        toast.error(response.data.pesan || 'Gagal mengaktifkan pengguna');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error(error.response?.data?.pesan || 'Terjadi kesalahan saat mengaktifkan pengguna');
    }
  };

  const columns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting dan paginasi
    },
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama', sortable: true },
    { id: 'nama_pengguna', label: 'Username', sortable: true },
    {
      id: 'aktif',
      label: 'Status',
      sortable: true,
      format: (value) => (
        <Chip
          label={value ? 'Aktif' : 'Nonaktif'}
          color={value ? 'success' : 'error'}
          size="small"
          sx={{
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      )
    },
    { 
      id: 'peran', 
      label: 'Role', 
      sortable: true,
      format: (value) => {
        let label = 'User';
        let color = 'default';
        let icon = <UserIcon />;
        
        switch(value) {
          case 'admin':
            label = 'Admin';
            color = 'primary';
            icon = <AdminIcon />;
            break;
          case 'kepala_lab':
            label = 'Kepala Lab';
            color = 'secondary';
            icon = <AdminIcon />;
            break;
          case 'toolman':
            label = 'Toolman';
            color = 'info';
            icon = <UserIcon />;
            break;
          case 'sarana':
            label = 'Sarana';
            color = 'default';
            icon = <UserIcon />;
            break;
          default:
            break;
        }
        
        return (
          <Chip 
            icon={icon}
            label={label}
            color={color}
            size="small"
            sx={{ color: 'white' }}
          />
        );
      }
    }
  ];

  // Table actions
  const actions = (row) => {
    console.log('Row data in actions:', row);
    // Log untuk debugging
    console.log('Username in row:', row.nama_pengguna);
    console.log('Role in row:', row.peran);
    console.log('Status aktif:', row.aktif);
    return (
      <Box>
        {(isAdmin() || isKepalaLab() || user.peran === 'toolman' || user.peran === 'sarana') && (
          <>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleOpenForm(row)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isKepalaLab() && (
              <>
                {row.aktif ? (
                  // Hanya tampilkan tombol nonaktifkan jika bukan user yang sedang login
                  row.id !== user.id && (
                    <Tooltip title="Nonaktifkan">
                      <IconButton 
                        onClick={() => handleDeactivate(row)} 
                        size="small" 
                        color="warning"
                      >
                        <PersonOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                ) : (
                  <Tooltip title="Aktifkan">
                    <IconButton 
                      onClick={() => handleActivate(row)} 
                      size="small" 
                      color="success"
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Hapus">
                  <IconButton 
                    onClick={() => handleDeleteConfirm(row)} 
                    size="small" 
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </>
        )}
      </Box>
    );
  };

  return (
    <>
      <PageHeader
        title="Manajemen Pengguna"
        actionText={isKepalaLab() ? "Tambah Pengguna" : undefined}
actionIcon={isKepalaLab() ? <AddIcon /> : undefined}
onActionClick={isKepalaLab() ? () => handleOpenForm() : undefined}
        breadcrumbs={[{ text: 'Pengguna' }]} 
      />

      <DataTable
        title="Daftar Pengguna"
        columns={columns}
        rows={users}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={() => fetchUsers(pagination.halaman, pagination.batas, searchTerm)}
        emptyMessage="Belum ada data pengguna"
        page={pagination.halaman - 1} // DataTable expects 0-indexed page
        count={pagination.total}
        rowsPerPage={pagination.batas}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterComponent={
          (isAdmin() || isKepalaLab()) && (
            <FormControl sx={{ minWidth: 120, mr: 2 }} size="small">
              <InputLabel id="filter-role-label">Filter Role</InputLabel>
              <Select
                labelId="filter-role-label"
                id="filter-role"
                value={selectedRole}
                label="Filter Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="kepala_lab">Kepala Lab</MenuItem>
                <MenuItem value="toolman">Toolman</MenuItem>
                <MenuItem value="sarana">Sarana</MenuItem>
              </Select>
            </FormControl>
          )
        }
      />

      {/* Add/Edit Form Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm} 
        maxWidth="sm" 
        fullWidth
        fullScreen={{ xs: true, sm: false }}
      >
        <DialogTitle sx={{
          fontSize: {
            xs: '1.1rem',
            sm: '1.25rem'
          },
          padding: {
            xs: '16px',
            sm: '24px'
          }
        }}>
          {currentUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
        </DialogTitle>
        <Formik
          initialValues={{
            nama: currentUser?.nama || '',
            nama_pengguna: currentUser?.nama_pengguna || '',
            kata_sandi: '',
            peran: currentUser?.peran || 'sarana',
          }}
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
          enableReinitialize={true}
          context={{ isEditing: Boolean(currentUser) }}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form>
              <DialogContent sx={{
                padding: {
                  xs: '16px',
                  sm: '24px'
                }
              }}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="nama"
                  name="nama"
                  label="Nama Lengkap"
                  value={values.nama}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.nama && Boolean(errors.nama)}
                  helperText={touched.nama && errors.nama}
                  disabled={!(isKepalaLab() || isAdmin() || user.peran === 'toolman' || user.peran === 'sarana')} // Admin, Kepala Lab, Toolman, Sarana bisa edit nama
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontSize: {
                        xs: '0.875rem',
                        sm: '1rem'
                      }
                    },
                    '& .MuiInputBase-input': {
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
                
                <TextField
                  fullWidth
                  margin="normal"
                  id="nama_pengguna"
                  name="nama_pengguna"
                  label="Username"
                  value={values.nama_pengguna}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.nama_pengguna && Boolean(errors.nama_pengguna)}
                  helperText={touched.nama_pengguna && errors.nama_pengguna}
                  disabled={!isKepalaLab()}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontSize: {
                        xs: '0.875rem',
                        sm: '1rem'
                      }
                    },
                    '& .MuiInputBase-input': {
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
                

                
                <TextField
                  fullWidth
                  margin="normal"
                  id="kata_sandi"
                  name="kata_sandi"
                  label={currentUser ? 'Password (Kosongkan jika tidak diubah)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={values.kata_sandi}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.kata_sandi && Boolean(errors.kata_sandi)}
                  helperText={touched.kata_sandi && errors.kata_sandi}
                  disabled={currentUser && !isKepalaLab() && !isAdmin() && user.peran !== 'toolman' && user.peran !== 'sarana'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          sx={{
                            padding: {
                              xs: '6px',
                              sm: '8px'
                            }
                          }}
                        >
                          {showPassword ? 
                            <VisibilityOffIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} /> : 
                            <VisibilityIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontSize: {
                        xs: '0.875rem',
                        sm: '1rem'
                      }
                    },
                    '& .MuiInputBase-input': {
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
                
                <FormControl 
                  fullWidth 
                  margin="normal"
                  error={touched.peran && Boolean(errors.peran)}
                  disabled={!isKepalaLab()}
                  sx={{
                    '& .MuiInputLabel-root': {
                      fontSize: {
                        xs: '0.875rem',
                        sm: '1rem'
                      }
                    },
                    '& .MuiSelect-select': {
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
                >
                  <InputLabel id="peran-label">Role</InputLabel>
                  <Select
                    id="peran"
                    name="peran"
                    value={values.peran}
                    label="Role"
                    labelId="peran-label"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="admin" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Admin</MenuItem>
                    <MenuItem value="kepala_lab" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Kepala Lab</MenuItem>
                    <MenuItem value="toolman" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Toolman</MenuItem>
                    <MenuItem value="sarana" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Sarana</MenuItem>
                  </Select>
                  {touched.peran && errors.peran && (
                    <FormHelperText>{errors.peran}</FormHelperText>
                  )}
                </FormControl>
              </DialogContent>
              
              <DialogActions sx={{ 
                px: { xs: 2, sm: 3 }, 
                pb: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Button 
                  onClick={handleCloseForm}
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
                  type="submit" 
                  variant="contained" 
                  disabled={isSubmitting}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    fontSize: {
                      xs: '0.875rem',
                      sm: '1rem'
                    }
                  }}
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
        title="Hapus Pengguna"
        content={`Apakah Anda yakin ingin menghapus pengguna ${currentUser?.nama}?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteLoading}
      />
    </>
  );
};

export default Pengguna;