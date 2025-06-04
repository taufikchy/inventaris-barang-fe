import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          logout();
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Clean up interceptors
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, navigate]);

  // Check if token is valid and set user
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Decode token to get user info
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Token expired
            logout();
          } else {
            try {
              // Verify token with backend and get user data
              const response = await axios.get('/api/auth/verify');
              if (response.data.sukses) {
                // Set user from backend response
                setUser({
                  id: response.data.data.id,
                  nama: response.data.data.nama,
                  namaPengguna: response.data.data.nama_pengguna,
                  peran: response.data.data.peran,
                });
              } else {
                logout();
              }
            } catch (error) {
              console.error('Error verifying token with backend:', error);
              logout();
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (namaPengguna, kataSandi) => {
    try {
      console.log('Attempting login with:', { namaPengguna });
      
      const response = await axios.post('/api/auth/login', {
        nama_pengguna: namaPengguna,
        kata_sandi: kataSandi,
      });

      console.log('Login response:', response.data);
      
      if (response.data.sukses) {
        const newToken = response.data.data.token;
        const userData = response.data.data.pengguna;
        
        console.log('Token received:', newToken);
        console.log('User data received:', userData);
        
        // Save token to localStorage
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Set user data
        setUser({
          id: userData.id,
          nama: userData.nama,
          namaPengguna: userData.nama_pengguna,
          peran: userData.peran,
        });

        toast.success(`Selamat datang, ${userData.nama}!`);
        return true;
      } else {
        toast.error(response.data.pesan || 'Login gagal');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      const message = error.response?.data?.pesan || 'Terjadi kesalahan saat login';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.peran === 'admin';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};