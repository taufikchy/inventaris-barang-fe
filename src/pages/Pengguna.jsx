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
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';

// Validation schema for user form
const UserSchema = Yup.object().shape({
  nama: Yup.string().required('Nama pengguna harus diisi'),
  username: Yup.string()
    .min(4, 'Username minimal 4 karakter')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore')
    .required('Username harus diisi'),
  email: Yup.string().email('Format email tidak valid').required('Email harus diisi'),
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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData = [
        { 
          id: 1, 
          nama: 'Admin Sistem', 
          username: 'admin', 
          email: 'admin@example.com',
          role: 'admin',
          last_login: '2023-05-25 08:30:15'
        },
        { 
          id: 2, 
          nama: 'Budi Santoso', 
          username: 'budi', 
          email: 'budi@example.com',
          role: 'user',
          last_login: '2023-05-24 14:15:22'
        },
        { 
          id: 3, 
          nama: 'Citra Dewi', 
          username: 'citra', 
          email: 'citra@example.com',
          role: 'user',
          last_login: '2023-05-23 09:45:10'
        },
        { 
          id: 4, 
          nama: 'Deni Pratama', 
          username: 'deni', 
          email: 'deni@example.com',
          role: 'admin',
          last_login: '2023-05-22 16:20:05'
        },
        { 
          id: 5, 
          nama: 'Eka Putri', 
          username: 'eka', 
          email: 'eka@example.com',
          role: 'user',
          last_login: '2023-05-21 11:10:30'
        },
      ];
      
      setUsers(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      // In a real application, you would send this data to your API
      console.log('Submitting user:', values);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentUser) {
        // Update existing user
        const updatedUsers = users.map(u =>
          u.id === currentUser.id ? { ...u, ...values } : u
        );
        setUsers(updatedUsers);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        // Add new user
        const newUser = {
          ...values,
          id: Math.max(0, ...users.map(u => u.id)) + 1,
          last_login: '-'
        };
        setUsers([...users, newUser]);
        toast.success('Pengguna berhasil ditambahkan');
      }
      
      resetForm();
      handleCloseForm();
    } catch (error) {
      console.error('Error submitting user:', error);
      toast.error('Gagal menyimpan pengguna');
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
      
      // In a real application, you would send this request to your API
      console.log('Deleting user:', currentUser);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from state
      setUsers(users.filter(u => u.id !== currentUser.id));
      toast.success('Pengguna berhasil dihapus');
      
      setConfirmDelete(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus pengguna');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Table columns definition
  const columns = [
    { id: 'id', label: 'ID', sortable: true },
    { id: 'nama', label: 'Nama', sortable: true },
    { id: 'username', label: 'Username', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { 
      id: 'role', 
      label: 'Role', 
      sortable: true,
      render: (value) => (
        <Chip 
          icon={value === 'admin' ? <AdminIcon /> : <UserIcon />}
          label={value === 'admin' ? 'Admin' : 'User'}
          color={value === 'admin' ? 'primary' : 'default'}
          size="small"
        />
      )
    },
    { id: 'last_login', label: 'Login Terakhir', sortable: true },
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
        <IconButton 
          onClick={() => handleDeleteConfirm(row)} 
          size="small" 
          color="error"
          disabled={row.username === 'admin'} // Prevent deleting the main admin
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Manajemen Pengguna"
        actionText="Tambah Pengguna"
        actionIcon={<AddIcon />}
        onActionClick={() => handleOpenForm()}
        breadcrumbs={[{ text: 'Pengguna' }]}
      />

      <DataTable
        title="Daftar Pengguna"
        columns={columns}
        rows={users}
        loading={loading}
        actions={actions}
        refreshable
        onRefresh={fetchUsers}
        emptyMessage="Belum ada data pengguna"
      />

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
        <Formik
          initialValues={{
            nama: currentUser?.nama || '',
            username: currentUser?.username || '',
            email: currentUser?.email || '',
            password: '',
            role: currentUser?.role || 'user',
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
                  name="nama"
                  label="Nama Lengkap"
                  value={values.nama}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.nama && Boolean(errors.nama)}
                  helperText={touched.nama && errors.nama}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  name="username"
                  label="Username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  disabled={currentUser?.username === 'admin'} // Prevent changing admin username
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  name="email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  name="password"
                  label={currentUser ? 'Password (Kosongkan jika tidak diubah)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
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
                  disabled={currentUser?.username === 'admin'} // Prevent changing admin role
                >
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={values.role}
                    label="Role"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
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