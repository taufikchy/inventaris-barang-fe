import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axios';

const useStockNotification = () => {
  const notificationShownRef = useRef(new Set());
  const intervalRef = useRef(null);

  const checkStockLevels = async () => {
    try {
      const response = await axios.get('/api/barang');
      if (response.data && response.data.sukses && Array.isArray(response.data.data)) {
        const barangBahan = response.data.data.filter(barang => 
          barang && barang.kategori?.tipe === 'bahan' && typeof barang.stok === 'number'
        );
        
        barangBahan.forEach(barang => {
          if (!barang || !barang.id || !barang.nama) return;
          
          const stok = Number(barang.stok) || 0;
          const jumlahAwal = Number(barang.jumlah) || 0;
          const persentaseStok = jumlahAwal > 0 ? (stok / jumlahAwal) * 100 : 0;
          
          // Notifikasi untuk stok kritis (≤ 10%)
          if (persentaseStok <= 10 && persentaseStok > 0) {
            const notificationKey = `critical-${barang.id}`;
            if (!notificationShownRef.current.has(notificationKey)) {
              toast.error(
                `🚨 Stok Kritis: ${barang.nama} tersisa ${stok} ${barang.satuan || 'unit'} (${persentaseStok.toFixed(1)}%)`,
                {
                  autoClose: 8000,
                  toastId: notificationKey,
                }
              );
              notificationShownRef.current.add(notificationKey);
              
              // Hapus dari set setelah 1 jam agar bisa muncul lagi
              setTimeout(() => {
                notificationShownRef.current.delete(notificationKey);
              }, 60 * 60 * 1000);
            }
          }
          // Notifikasi untuk stok menipis (≤ 25%)
          else if (persentaseStok <= 25 && persentaseStok > 10) {
            const notificationKey = `warning-${barang.id}`;
            if (!notificationShownRef.current.has(notificationKey)) {
              toast.warning(
                `⚠️ Stok Menipis: ${barang.nama} tersisa ${stok} ${barang.satuan || 'unit'} (${persentaseStok.toFixed(1)}%)`,
                {
                  autoClose: 6000,
                  toastId: notificationKey,
                }
              );
              notificationShownRef.current.add(notificationKey);
              
              // Hapus dari set setelah 2 jam agar bisa muncul lagi
              setTimeout(() => {
                notificationShownRef.current.delete(notificationKey);
              }, 2 * 60 * 60 * 1000);
            }
          }
          // Hapus notifikasi yang sudah tidak relevan (stok sudah aman)
          else if (persentaseStok > 25) {
            const criticalKey = `critical-${barang.id}`;
            const warningKey = `warning-${barang.id}`;
            notificationShownRef.current.delete(criticalKey);
            notificationShownRef.current.delete(warningKey);
          }
        });
      }
    } catch (error) {
      console.error('Error checking stock levels:', error);
      // Jangan throw error agar tidak mengganggu aplikasi
    }
  };

  useEffect(() => {
    // Cek stok saat hook pertama kali digunakan
    checkStockLevels();
    
    // Set interval untuk cek stok setiap 5 menit
    intervalRef.current = setInterval(checkStockLevels, 5 * 60 * 1000);
    
    // Cleanup interval saat component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Return function untuk manual check (bisa dipanggil setelah transaksi)
  return {
    checkStockLevels,
  };
};

export default useStockNotification;