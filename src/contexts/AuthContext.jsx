import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { setAuthToken } from '../utils/axios';
import jwtDecode from 'jwt-decode';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up axios auth token
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);
  
  // Set up response interceptor for 401 errors
  useEffect(() => {
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
      // Clean up interceptor
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  // Check if token is valid and set user
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && (!token || storedToken !== token)) {
        // Update token state if localStorage token exists but different from state
        console.log('Token found in localStorage but different from state, updating...');
        setToken(storedToken);
        return; // useEffect will run again with updated token
      }
      
      if (token) {
        try {
          // Decode token to get user info
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Token expired
            console.log('Token expired, logging out');
            logout();
          } else {
            try {
              // Verify token with backend and get user data
              console.log('Verifying token with backend...');
              const response = await axios.get('/api/auth/verify');
              console.log('Token verification response:', response.data);
              
              if (response.data.sukses) {
                // Set user from backend response
                console.log('Token verified successfully, setting user data');
                setUser({
                  id: response.data.data.id,
                  nama: response.data.data.nama,
                  namaPengguna: response.data.data.nama_pengguna,
                  peran: response.data.data.peran,
                });
              } else {
                console.log('Token verification failed, logging out');
                logout();
              }
            } catch (error) {
              console.error('Error verifying token with backend:', error);
              console.error('Error response:', error.response?.data);
              logout();
            }
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          logout();
        }
      } else {
        console.log('No token found in state or localStorage');
        // Ensure user is null when no token
        if (user) setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);
  
  // Periodic token verification (every 5 minutes)
  useEffect(() => {
    const verifyTokenPeriodically = () => {
      if (token) {
        console.log('Performing periodic token verification');
        // Force token re-verification by setting it again
        setToken(token);
      }
    };
    
    // Initial verification
    verifyTokenPeriodically();
    
    // Set up interval for periodic verification
    const intervalId = setInterval(verifyTokenPeriodically, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

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
        
        // Update axios auth token
        setAuthToken(newToken);
        
        // Update state
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
    console.log('Logging out, removing token');
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Clear axios auth token
    setAuthToken(null);
    
    // Update state
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.peran === 'admin';
  };

  const isKepalaLab = () => {
    return user?.peran === 'kepala_lab';
  };

  const isToolman = () => {
    return user?.peran === 'toolman';
  };

  const isSarana = () => {
    return user?.peran === 'sarana';
  };

  const isAdminOrToolman = () => {
    return user?.peran === 'admin' || user?.peran === 'toolman';
  };

  const isAdminOrKepalaLab = () => {
    return user?.peran === 'admin' || user?.peran === 'kepala_lab';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isKepalaLab,
    isToolman,
    isSarana,
    isAdminOrToolman,
    isAdminOrKepalaLab,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};