import axios from 'axios';

// Buat instance axios dengan baseURL yang benar
const instance = axios.create({
  baseURL: '/', // Akan diproxy ke http://localhost:5000 oleh Vite
  withCredentials: true,
  timeout: 10000
});

// Fungsi untuk mengatur token autentikasi
export const setAuthToken = (token) => {
  console.log(`Setting auth token: ${token ? 'exists' : 'null/undefined'}`);
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Simpan token ke localStorage
    localStorage.setItem('token', token);
    console.log('Authorization header set successfully');
    console.log('Current headers:', instance.defaults.headers.common);
  } else {
    delete instance.defaults.headers.common['Authorization'];
    // Hapus token dari localStorage
    localStorage.removeItem('token');
    console.log('Authorization header removed');
  }
};

// Request interceptor untuk menambahkan token ke setiap permintaan
instance.interceptors.request.use(
  (config) => {
    // Selalu ambil token terbaru dari localStorage untuk setiap request
    const currentToken = localStorage.getItem('token');
    console.log(`Request to ${config.url}: Token ${currentToken ? 'exists' : 'not found'}`);
    
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
      console.log(`Setting Authorization header for ${config.url}`);
    } else {
      console.log(`No token available for ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor untuk menangani error 401
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired atau invalid
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

// Inisialisasi token dari localStorage saat aplikasi dimuat
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
  console.log('Initial token loaded from localStorage');
} else {
  console.log('No initial token found in localStorage');
}

// Hanya ekspor sekali
export default instance;