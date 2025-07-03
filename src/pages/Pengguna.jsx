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
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';

// Define user roles as a constant for better maintainability
const USER_ROLES = {
  ADMIN: 'admin',
  TOOLMAN: 'toolman',
  SARANA: 'sarana',
  KEPALA_LAB: 'kepala_lab',
};

// Validation schema for user form
const UserSchema = Yup.object().shape({
  nama: Yup.string().required('Nama pengguna harus diisi'),
  username: Yup.string()
    .min(4, 'Username minimal 4 karakter')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore')
    .required('Username harus diisi'),

  password: Yup.string()
    .min(6, 'Password minimal 6 karakter')
    .when('$isEditing', {
      is: false,
      then: (schema) => schema.required('Password harus diisi'),
      otherwise: (schema) => schema,
    }),
  role: Yup.string().required('Role harus dipilih'),
});

const Pengguna = () => {
  const { isAdminOrToolman, isKepalaLab } = useAuth();
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Fetch users data
  const fetchUsers = async (page = pagination.halaman, limit = pagination.batas, search = searchTerm) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/pengguna', {
        params: {
          halaman: page,
          batas: limit,
          cari: search,
        },
      });
      if (response.data.sukses) {
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
    fetchUsers(pagination.halaman, pagination.batas, searchTerm);
  }, [pagination.halaman, pagination.batas, searchTerm]);

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

  // Handle form submit (add/edit)
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Map frontend field names to backend field names
      const dataToSend = {
        nama: values.nama,
        nama_pengguna: values.username, // Map username to nama_pengguna
        kata_sandi: values.password,
        peran: values.role, // Map role to peran
      };

      let response;
      if (currentUser) {
        // Update existing user
        response = await axios.put(`/api/pengguna/${currentUser.id}`, dataToSend);
        if (response.data.sukses) {
          toast.success('Pengguna berhasil diperbarui');
        } else {
          toast.error(response.data.pesan || 'Gagal memperbarui pengguna');
        }
      } else {
        // Add new user
        response = await axios.post('/api/pengguna', dataToSend);
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

  const columns = [
    { 
      id: 'no', 
      label: 'No', 
      sortable: true,
      format: (value, row, displayIndex) => displayIndex + 1 // Menampilkan nomor urut berdasarkan posisi setelah sorting dan paginasi
    },
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama', sortable: true },
    { 
      id: 'nama_pengguna', 
      label: 'Username', 
      sortable: true,
      render: (value) => (
        <Box fontWeight="bold">
          {value}
        </Box>
      )
    },
    { 
      id: 'peran', 
      label: 'Role', 
      sortable: true,
      render: (value) => (
        <Chip 
          icon={value === USER_ROLES.ADMIN ? <AdminIcon /> :
                value === USER_ROLES.TOOLMAN ? <BuildIcon /> :
                value === USER_ROLES.SARANA ? <InventoryIcon /> :
                value === USER_ROLES.KEPALA_LAB ? <ScienceIcon /> : <AdminIcon />} 
          label={value === USER_ROLES.ADMIN ? 'Admin' :
                value === USER_ROLES.TOOLMAN ? 'Toolman' :
                value === USER_ROLES.SARANA ? 'Sarana' :
                value === USER_ROLES.KEPALA_LAB ? 'Kepala Lab' : 'Admin'}
          color={value === USER_ROLES.ADMIN ? 'primary' :
                 value === USER_ROLES.TOOLMAN ? 'secondary' :
                 value === USER_ROLES.SARANA ? 'success' :
                 value === USER_ROLES.KEPALA_LAB ? 'warning' : 'default'}
          size="small"
        />
      )
    },
  ];

  // Table actions
  const actions = (row) => (
    <Box>
      {isKepalaLab() && (
        <>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleOpenForm(row)} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
    </Box>
  );


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
      />

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
        <Formik
          initialValues={{
            nama: currentUser ? currentUser.nama : '',
            username: currentUser ? currentUser.nama_pengguna : '',
            password: '',
            role: currentUser ? currentUser.peran : USER_ROLES.ADMIN,
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
              <DialogContent>
                <TextField
                  fullWidth
                  margin="normal"
                  id="nama"
                  name="nama"
                  label="Nama Lengkap"
                  value={values.nama}
                  onChange={handleChange}
                  autoComplete="name"
                  onBlur={handleBlur}
                  error={touched.nama && Boolean(errors.nama)}
                  helperText={touched.nama && errors.nama}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  id="username"
                  name="username"
                  label="Username"
                  value={values.username}
                  onChange={handleChange}
                  autoComplete="username"
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  disabled={!isKepalaLab() || (currentUser && currentUser.username === 'admin')} // Prevent changing admin username unless kalab
                />
                

                
                <TextField
                  fullWidth
                  margin="normal"
                  id="password"
                  name="password"
                  label={currentUser ? 'Password (Kosongkan jika tidak diubah)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  autoComplete={currentUser ? 'off' : 'new-password'}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <FormControl 
                  fullWidth 
                  margin="normal"
                  error={touched.role && Boolean(errors.role)}
                  disabled={!isKepalaLab() || (currentUser && currentUser.username === 'admin')} // Prevent changing admin role unless kalab
                >
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    id="role"
                    name="role"
                    value={values.role}
                    label="Role"
                    labelId="role-label"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {Object.values(USER_ROLES).map((role) => (
                      <MenuItem key={role} value={role}>
                        {role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.role && errors.role && (
                    <FormHelperText>{errors.role}</FormHelperText>
                  )}
                </FormControl>
              </DialogContent>
              
              <DialogActions sx={{ px: 3, pb: 2 }}>
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