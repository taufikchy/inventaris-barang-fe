import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import autoTable sebagai named import untuk memastikan plugin ter-load dengan benar

class PDFGenerator {
  constructor() {
    this.doc = null;
    this.primaryColor = [41, 128, 185]; // Warna biru profesional
    this.secondaryColor = [52, 73, 94]; // Abu-abu gelap
    this.accentColor = [231, 76, 60]; // Warna aksen merah
    this.lightGray = [236, 240, 241];
    this.darkGray = [127, 140, 141];
    this.logoData = null;
  }

  // Memuat logo dan mengkonversi ke base64
  async loadLogo() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Hitung dimensi baru dengan mempertahankan aspect ratio
        const targetSize = 150; // Ukuran target dalam pixel
        let width = img.width;
        let height = img.height;
        
        // Hitung scaling factor
        const scaleFactor = Math.min(targetSize / width, targetSize / height);
        width = width * scaleFactor;
        height = height * scaleFactor;
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataURL = canvas.toDataURL('image/png');
        this.logoData = {
          data: dataURL,
          width: width,
          height: height,
          scaleFactor: scaleFactor
        };
        resolve(dataURL);
      };
      img.onerror = () => {
        console.warn('Logo tidak dapat dimuat, menggunakan placeholder');
        resolve(null);
      };
      img.src = '/images/logo-smkn-manonjaya.png';
    });
  }

  // Membuat placeholder logo
  drawLogoPlaceholder(doc, x, y, size) {
    // Kotak dengan sudut melengkung
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, size, size, 3, 3, 'FD');
    
    // Teks placeholder terpusat
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'bold');
    
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    doc.text('LOGO', centerX, centerY - 5, { align: 'center' });
    doc.text('SMKN', centerX, centerY, { align: 'center' });
    doc.text('MANONJAYA', centerX, centerY + 5, { align: 'center' });
    
    doc.setFont('times', 'normal'); // Kembalikan font default
  }

  // Inisialisasi dokumen PDF
  initDocument() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      filters: ['ASCIIHexEncode']
    });
    
    // Set font default Times New Roman
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    
    // Margin standar surat resmi Indonesia
    this.margins = {
      top: 25,    // 2.5 cm dari atas
      left: 25,   // 2.5 cm dari kiri
      right: 20,  // 2 cm dari kanan
      bottom: 20  // 2 cm dari bawah
    };
    
    // Dimensi halaman
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
    
    return this.doc;
  }

  // Membuat kop surat yang profesional
  addHeader(yPos, isNewPage = false) {
    const doc = this.doc;
    let currentY = yPos;
    
    // Area untuk logo (kiri atas)
    const logoSize = 20; // Ukuran area logo 20x20mm
    const logoX = this.margins.left;
    const logoY = currentY;
    
    // Tambahkan logo atau placeholder
    if (this.logoData && this.logoData.data) {
      try {
        // Hitung posisi untuk memusatkan logo di area yang dialokasikan
        const logoWidth = this.logoData.width * 0.15; // Konversi pixel ke mm (approx)
        const logoHeight = this.logoData.height * 0.15;
        
        const xPos = logoX + (logoSize - logoWidth) / 2;
        const yPos = logoY + (logoSize - logoHeight) / 2;
        
        doc.addImage(
          this.logoData.data, 
          'PNG', 
          xPos, 
          yPos, 
          logoWidth, 
          logoHeight,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Gagal menambahkan logo:', error);
        this.drawLogoPlaceholder(doc, logoX, logoY, logoSize);
      }
    } else {
      this.drawLogoPlaceholder(doc, logoX, logoY, logoSize);
    }
    
    // Area teks kop surat (kanan logo)
    const textStartX = logoX + logoSize + 5; // Jarak 5mm dari logo
    const textWidth = this.pageWidth - this.margins.right - textStartX;
    
    // Style untuk teks kop surat
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    
    // Baris 1: PEMERINTAH PROVINSI JAWA BARAT
    doc.setFontSize(12);
    const line1 = 'PEMERINTAH PROVINSI JAWA BARAT';
    const centerX = textStartX + textWidth / 2;
    doc.text(line1, centerX, currentY + 8, { align: 'center' });
    
    // Baris 2: DINAS PENDIDIKAN
    doc.setFontSize(12);
    const line2 = 'DINAS PENDIDIKAN';
    doc.text(line2, centerX, currentY + 14, { align: 'center' });
    
    // Baris 3: SMK NEGERI MANONJAYA (lebih besar)
    doc.setFontSize(14);
    const line3 = 'SMK NEGERI MANONJAYA';
    doc.text(line3, centerX, currentY + 20, { align: 'center' });
    
    currentY += logoSize + 10; // Jarak setelah logo
    
    // Alamat dan kontak (full width, centered)
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    
    const address = 'Jl. Raya Manonjaya No. 152, Manonjaya, Tasikmalaya, Jawa Barat 46197';
    doc.text(address, this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    
    const contact = 'Telp. (0265) 123456 | Email: smknmanonjaya@gmail.com | Website: www.smknmanonjaya.sch.id';
    doc.text(contact, this.pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    
    // Garis pembatas
   
    
    doc.setLineWidth(0.5);
    doc.line(this.margins.left, currentY, this.pageWidth - this.margins.right, currentY);
    
    return currentY + (isNewPage ? 5 : 10);
  }

  // Membuat judul dokumen
  addTitle(title, subtitle, yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    // Judul utama
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    const titleWidth = doc.getTextWidth(title);
    const titleX = (this.pageWidth - titleWidth) / 2;
    doc.text(title, titleX, currentY);
    
    // Garis bawah judul
    doc.setLineWidth(0.8);
    doc.line(titleX, currentY + 2, titleX + titleWidth, currentY + 2);
    currentY += 10;
    
    // Subjudul (jika ada)
    if (subtitle) {
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      
      const subtitleWidth = doc.getTextWidth(subtitle);
      doc.text(subtitle, (this.pageWidth - subtitleWidth) / 2, currentY);
      currentY += 10;
    }
    
    return currentY;
  }

  // Header surat resmi (nomor, lampiran, perihal)
  addOfficialLetterHeader(nomor, lampiran, perihal, yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Nomor Surat
    doc.text('Nomor', this.margins.left, currentY);
    doc.text(':', this.margins.left + 20, currentY);
    doc.text(nomor, this.margins.left + 25, currentY);
    currentY += 7;
    
    // Lampiran
    doc.text('Lampiran', this.margins.left, currentY);
    doc.text(':', this.margins.left + 20, currentY);
    doc.text(lampiran, this.margins.left + 25, currentY);
    currentY += 7;
    
    // Perihal
    doc.text('Perihal', this.margins.left, currentY);
    doc.text(':', this.margins.left + 20, currentY);
    doc.text(perihal, this.margins.left + 25, currentY);
    currentY += 12;
    
    return currentY;
  }

  // Konten surat peminjaman
  addBorrowingLetterContent(peminjaman, yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    // Kepada Yth.
    doc.text('Kepada Yth.', this.margins.left, currentY);
    currentY += 7;
    
    // Tujuan surat
    doc.text('Kepala Laboratorium Komputer', this.margins.left + 10, currentY);
    currentY += 7;
    
    doc.text('SMK Negeri Manonjaya', this.margins.left + 10, currentY);
    currentY += 7;
    
    doc.text('Di', this.margins.left + 10, currentY);
    doc.setFont('times', 'bold');
    doc.text('Tempat', this.margins.left + 16, currentY);
    doc.setFont('times', 'normal');
    currentY += 12;
    
    // Salam pembuka
    doc.text('Dengan hormat,', this.margins.left, currentY);
    currentY += 10;
    
    // Paragraf pembuka
    const openingText = 'Bersama ini kami mengajukan permohonan peminjaman barang laboratorium komputer dengan rincian sebagai berikut:';
    const splitText = doc.splitTextToSize(openingText, this.contentWidth - 10);
    doc.text(splitText, this.margins.left + 10, currentY);
    currentY += splitText.length * 6 + 10;
    
    // Informasi peminjam
    doc.text(`Nama Peminjam   : ${peminjaman.nama_peminjam || peminjaman.peminjam || '-'}`, this.margins.left, currentY);
    currentY += 7;
    
    doc.text(`Kelas/NIM         : ${peminjaman.kelas_peminjam || peminjaman.kelas || '-'}`, this.margins.left, currentY);
    currentY += 7;
    
    doc.text(`Tanggal Pinjam : ${this.formatDate(peminjaman.tanggal_pinjam)}`, this.margins.left, currentY);
    currentY += 15;
    
    return currentY;
  }

  // Tabel barang yang dipinjam
  addItemsTable(items, yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    // Periksa jika perlu halaman baru
    currentY = this.checkPageBreak(currentY, 30);
    
    // Judul tabel
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('Adapun barang yang akan dipinjam adalah sebagai berikut:', this.margins.left, currentY);
    currentY += 10;
    
    // Header tabel
    const tableConfig = {
      startX: this.margins.left,
      startY: currentY,
      head: [['No.', 'Nama Barang', 'Jumlah', 'Satuan', 'Kondisi']],
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 }
      },
      margin: { top: 10 }
    };
    
    // Data tabel - pastikan items adalah array
    const tableData = Array.isArray(items) ? items.map((item, index) => [
      (index + 1).toString(),
      item.nama_barang || item.nama || '-',
      item.jumlah || item.qty || '1',
      item.satuan || item.unit || 'pcs',
      item.kondisi || item.status || 'Baik'
    ]) : [['1', 'Tidak ada data', '-', '-', '-']];
    
    // Tambahkan tabel ke dokumen
    autoTable(doc, {
      ...tableConfig,
      body: tableData
    });
    
    // Update posisi Y setelah tabel - estimasi berdasarkan jumlah baris
    const estimatedRowHeight = 8; // mm per baris
    const headerHeight = 10;
    const tableHeight = headerHeight + (tableData.length * estimatedRowHeight);
    currentY = currentY + tableHeight + 10;
    
    return currentY;
  }

  // Syarat dan ketentuan
  addTermsAndConditions(yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    // Periksa jika perlu halaman baru
    currentY = this.checkPageBreak(currentY, 50);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    
    // Judul section
    doc.text('Dengan ketentuan sebagai berikut:', this.margins.left, currentY);
    currentY += 10;
    
    // Daftar syarat
    const terms = [
      'Barang yang dipinjam harus dikembalikan dalam kondisi baik dan sesuai dengan spesifikasi awal',
      'Peminjam bertanggung jawab penuh atas kerusakan atau kehilangan barang selama masa peminjaman',
      'Pengembalian barang harus sesuai dengan jadwal yang telah disepakati',
      'Barang yang rusak atau hilang akan dikenakan sanksi sesuai dengan peraturan yang berlaku',
      'Peminjam wajib menjaga dan merawat barang yang dipinjam selama masa peminjaman'
    ];
    
    terms.forEach((term, index) => {
      // Periksa jika perlu halaman baru untuk setiap item
      currentY = this.checkPageBreak(currentY, 8);
      
      doc.text(`${index + 1}. ${term}`, this.margins.left + 5, currentY);
      currentY += 7;
    });
    
    currentY += 10;
    
    // Penutup
    const closingText = 'Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.';
    const splitClosing = doc.splitTextToSize(closingText, this.contentWidth);
    doc.text(splitClosing, this.margins.left, currentY);
    currentY += splitClosing.length * 6 + 20;
    
    return currentY;
  }

  // Bagian tanda tangan
  addSignatures(peminjaman, yPos) {
    const doc = this.doc;
    let currentY = yPos;
    
    // Periksa jika perlu halaman baru
    currentY = this.checkPageBreak(currentY, 50);
    
    // Tanggal surat
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(`Tasikmalaya, ${currentDate}`, this.pageWidth - this.margins.right - 50, currentY);
    currentY += 20;
    
    // Tanda tangan kiri (Kepala Lab)
    doc.text('Mengetahui,', this.margins.left + 20, currentY);
    doc.text('Kepala Laboratorium Komputer', this.margins.left + 20, currentY + 7);
    
    // Tanda tangan kanan (Peminjam)
    doc.text('Pemohon,', this.pageWidth - this.margins.right - 50, currentY);
    
    // Jarak untuk tanda tangan
    currentY += 30;
    
    // Nama dan NIP/NIM
    doc.text('(________________________)', this.margins.left + 20, currentY);
    doc.text('NIP. ___________________', this.margins.left + 20, currentY + 7);
    
    const peminjamName = peminjaman.nama_peminjam || peminjaman.peminjam || 'Nama Peminjam';
    doc.text(`(${peminjamName})`, this.pageWidth - this.margins.right - 50, currentY);
    doc.text('NIS/NIM. _______________', this.pageWidth - this.margins.right - 50, currentY + 7);
    
    return currentY + 20;
  }

  // Format tanggal Indonesia
  formatDate(dateString) {
    if (!dateString) return '-';
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }

  // Generate surat peminjaman lengkap
  async generateBorrowingLetter(peminjaman) {
    // Muat logo terlebih dahulu
    await this.loadLogo();
    
    // Inisialisasi dokumen
    this.initDocument();
    
    // Tambahkan kop surat
    let currentY = this.addHeader(this.margins.top);
    
    // Tambahkan judul surat
    currentY = this.addTitle(
      'SURAT PERMOHONAN PEMINJAMAN BARANG', 
      null, 
      currentY + 10
    );
    
    // Tambahkan header surat resmi
    const nomor = `${peminjaman.kode || 'XXX'}/SMK-MNJ/LAB-KOMP/${new Date().getFullYear()}`;
    const lampiran = '-';
    const perihal = 'Permohonan Peminjaman Barang Laboratorium';
    
    currentY = this.addOfficialLetterHeader(
      nomor, 
      lampiran, 
      perihal, 
      currentY + 5
    );
    
    // Tambahkan konten surat
    currentY = this.addBorrowingLetterContent(peminjaman, currentY);
    
    // Tambahkan tabel barang
    const items = peminjaman.DetailPeminjaman || peminjaman.detail_peminjaman || [];
    currentY = this.addItemsTable(items, currentY);
    
    // Tambahkan syarat dan ketentuan
    currentY = this.addTermsAndConditions(currentY);
    
    // Tambahkan tanda tangan
    currentY = this.addSignatures(peminjaman, currentY);
    
    return this.doc;
  }

  // Cek jika perlu halaman baru
  checkPageBreak(currentY, requiredSpace = 20) {
    if (currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      return this.addHeader(this.margins.top, true);
    }
    return currentY;
  }

  // Simpan PDF
  savePDF(filename = 'surat-peminjaman.pdf') {
    if (this.doc) {
      this.doc.save(filename);
    }
  }

  // Buka PDF di tab baru
  openPDF() {
    if (this.doc) {
      window.open(this.doc.output('bloburl'), '_blank');
    }
  }
}

export default PDFGenerator;