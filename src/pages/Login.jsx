import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Validation schema
const LoginSchema = Yup.object().shape({
  namaPengguna: Yup.string().required('Nama pengguna harus diisi'),
  kataSandi: Yup.string().required('Kata sandi harus diisi'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    const success = await login(values.namaPengguna, values.kataSandi);
    if (success) {
      navigate('/dashboard');
    }
    setSubmitting(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Login
      </Typography>

      <Formik
        initialValues={{
          namaPengguna: '',
          kataSandi: '',
        }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Field
              as={TextField}
              fullWidth
              id="namaPengguna"
              name="namaPengguna"
              label="Nama Pengguna"
              margin="normal"
              error={touched.namaPengguna && Boolean(errors.namaPengguna)}
              helperText={touched.namaPengguna && errors.namaPengguna}
              autoFocus
            />

            <Field
              as={TextField}
              fullWidth
              id="kataSandi"
              name="kataSandi"
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              error={touched.kataSandi && Boolean(errors.kataSandi)}
              helperText={touched.kataSandi && errors.kataSandi}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Masuk'}
            </Button>
          </Form>
        )}
      </Formik>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Sistem Inventaris Barang © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;