import React from 'react';
import { Button } from '@mui/material';
import PDFGenerator from './PDFGenerator';
import { toast } from 'react-toastify';

const PDFTestButton = ({ peminjaman }) => {
  const handleTestPDF = async () => {
    try {
      // Sample data for testing if no peminjaman provided
      const testData = peminjaman || {
        kode: 'PJ-2024-001',
        nama_peminjam: 'John Doe',
        peminjam: 'John Doe',
        kontak_peminjam: '081234567890',
        kontak: '081234567890',
        kelas_peminjam: 'XII RPL 1',
        kelas: 'XII RPL 1',
        tanggal_pinjam: '2024-01-15',
        tanggal_kembali_harapan: '2024-01-20',
        catatan: 'Untuk praktikum jaringan komputer',
        keterangan: 'Untuk praktikum jaringan komputer',
        DetailPeminjaman: [
          {
            Barang: {
              kode_barang: 'KB-001',
              nama_barang: 'Laptop ASUS VivoBook'
            },
            jumlah: 2,
            kondisi_saat_pinjam: 'Baik'
          },
          {
            Barang: {
              kode_barang: 'KB-002',
              nama_barang: 'Mouse Wireless Logitech'
            },
            jumlah: 2,
            kondisi_saat_pinjam: 'Baik'
          },
          {
            Barang: {
              kode_barang: 'KB-003',
              nama_barang: 'Kabel HDMI 2 Meter'
            },
            jumlah: 1,
            kondisi_saat_pinjam: 'Baik'
          }
        ]
      };

      const pdfGenerator = new PDFGenerator();
      const doc = await pdfGenerator.generateBorrowingLetter(testData);
      pdfGenerator.openPDF();
      
      toast.success('PDF berhasil dibuat!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF: ' + error.message);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleTestPDF}
      sx={{ m: 1 }}
    >
      Test PDF Generator
    </Button>
  );
};

export default PDFTestButton;