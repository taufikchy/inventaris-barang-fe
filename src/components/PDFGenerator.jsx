import React from 'react';
import jsPDF from 'jspdf';

// Dynamic import untuk autoTable
let autoTableLoaded = false;
let autoTableFunction = null;

const loadAutoTable = async () => {
  if (!autoTableLoaded) {
    try {
      console.log('Loading jspdf-autotable module...');
      
      // Import autoTable module
      const autoTableModule = await import('jspdf-autotable');
      console.log('AutoTable module imported:', autoTableModule);
      
      // Dapatkan function autoTable dari module
      autoTableFunction = autoTableModule.default || autoTableModule.autoTable || autoTableModule;
      console.log('AutoTable function type:', typeof autoTableFunction);
      
      if (typeof autoTableFunction !== 'function') {
        throw new Error('AutoTable function not found in module');
      }
      
      // Pastikan jsPDF prototype memiliki autoTable
      if (!jsPDF.prototype.autoTable) {
        jsPDF.prototype.autoTable = autoTableFunction;
        console.log('AutoTable function added to jsPDF prototype');
      }
      
      // Verifikasi bahwa autoTable tersedia
      if (typeof jsPDF.prototype.autoTable !== 'function') {
        throw new Error('Failed to add autoTable to jsPDF prototype');
      }
      
      autoTableLoaded = true;
      console.log('AutoTable plugin loaded successfully');
      
    } catch (error) {
      console.error('Failed to load autoTable:', error);
      autoTableLoaded = false;
      autoTableFunction = null;
      throw new Error(`Failed to load jsPDF autoTable plugin: ${error.message}`);
    }
  }
  
  return autoTableFunction;
};

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
  async initDocument() {
    try {
      console.log('Initializing PDF document...');
      
      // Pastikan jsPDF tersedia
      if (typeof jsPDF === 'undefined') {
        throw new Error('jsPDF not available');
      }
      
      // Load autoTable plugin dan dapatkan function
      const autoTableFunc = await loadAutoTable();
      console.log('AutoTable function loaded:', typeof autoTableFunc);
      
      // Delay untuk memastikan plugin ter-load sempurna
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Buat instance jsPDF baru
      this.doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Pastikan instance berhasil dibuat
      if (!this.doc) {
        throw new Error('Failed to create jsPDF instance');
      }
      
      // Pastikan semua method jsPDF dasar tersedia terlebih dahulu
      const basicMethods = ['getTextWidth', 'setFont', 'setFontSize', 'text', 'line', 'setTextColor', 'getFontSize', 'getFont'];
      for (const method of basicMethods) {
        if (typeof this.doc[method] !== 'function') {
          console.error(`jsPDF basic method '${method}' not available`);
          throw new Error(`jsPDF basic method '${method}' not available`);
        }
      }
      
      console.log('Basic jsPDF methods verified successfully');
      
      // Verifikasi bahwa autoTable tersedia pada instance
      console.log('Checking autoTable on instance...');
      console.log('jsPDF.prototype.autoTable:', typeof jsPDF.prototype.autoTable);
      console.log('this.doc.autoTable:', typeof this.doc.autoTable);
      
      // Jika autoTable tidak tersedia pada instance, tambahkan secara manual
      if (typeof this.doc.autoTable !== 'function') {
        if (typeof autoTableFunc === 'function') {
          // Bind autoTable function dengan context yang benar
          this.doc.autoTable = function(...args) {
            return autoTableFunc.call(this, ...args);
          }.bind(this.doc);
          console.log('AutoTable manually bound to instance with proper context');
        } else {
          throw new Error('AutoTable function not available');
        }
      }
      
      // Final verification untuk autoTable
      if (typeof this.doc.autoTable !== 'function') {
        console.error('Final check: autoTable still not available');
        console.error('Available methods on this.doc:', Object.getOwnPropertyNames(this.doc).filter(name => typeof this.doc[name] === 'function'));
        throw new Error('autoTable method not available on jsPDF instance after all attempts');
      }
      
      // Test basic jsPDF functionality
      try {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
        const testWidth = this.doc.getTextWidth('test');
        console.log('jsPDF basic functionality test passed, text width:', testWidth);
      } catch (testError) {
        console.error('jsPDF basic functionality test failed:', testError);
        throw new Error('jsPDF instance not functioning properly');
      }
      
      console.log('PDF document initialized successfully with autoTable');
      
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
    } catch (error) {
      console.error('Error initializing PDF document:', error);
      throw error;
    }
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
    
    // Pastikan doc sudah terinisialisasi
    if (!doc) {
      console.error('PDF document not initialized');
      return currentY + 20;
    }
    
    // Pastikan getTextWidth method tersedia
    if (typeof doc.getTextWidth !== 'function') {
      console.error('getTextWidth method not available on PDF document');
      // Fallback: gunakan estimasi lebar teks
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, this.pageWidth / 2, currentY, { align: 'center' });
      return currentY + 20;
    }
    
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
      
      if (typeof doc.getTextWidth === 'function') {
        const subtitleWidth = doc.getTextWidth(subtitle);
        doc.text(subtitle, (this.pageWidth - subtitleWidth) / 2, currentY);
      } else {
        // Fallback jika getTextWidth tidak tersedia
        doc.text(subtitle, this.pageWidth / 2, currentY, { align: 'center' });
      }
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
    
    // Data tabel
    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.nama_barang || item.nama || '-',
      item.jumlah || item.qty || '1',
      item.satuan || item.unit || 'pcs',
      item.kondisi || item.status || 'Baik'
    ]);
    
    // Tambahkan tabel ke dokumen
    autoTable(doc, {
      ...tableConfig,
      body: tableData
    });
    
    // Update posisi Y setelah tabel
    currentY = doc.lastAutoTable.finalY + 10;
    
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

  // Generate laporan inventaris
  async generateInventoryReport(reportData, reportTitle, periode, columns) {
    try {
      console.log('Starting PDF generation...');
      
      // Reset document jika sudah ada
      this.doc = null;
      
      // Muat logo terlebih dahulu
      await this.loadLogo();
      
      // Inisialisasi dokumen
      await this.initDocument();
      
      console.log('PDF document initialized successfully');
      
      // Pastikan dokumen terinisialisasi dengan benar
      if (!this.doc) {
        throw new Error('Failed to initialize PDF document');
      }
      
      // Pastikan semua method yang diperlukan tersedia
      if (typeof this.doc.setFont !== 'function' || 
          typeof this.doc.setFontSize !== 'function' ||
          typeof this.doc.text !== 'function') {
        throw new Error('jsPDF methods not available');
      }
      
      // Tambahkan kop surat
      let currentY = this.addHeader(this.margins.top);
      
      // Tambahkan judul laporan
      currentY = this.addTitle(reportTitle, null, currentY + 10);
      
      // Pastikan currentY valid
      if (isNaN(currentY) || currentY < 0) {
        currentY = this.margins.top + 60;
      }
    
    // Tambahkan periode laporan
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    
    // Pastikan getTextWidth tersedia
    if (typeof this.doc.getTextWidth === 'function') {
      const periodeWidth = this.doc.getTextWidth(periode);
      this.doc.text(periode, (this.pageWidth - periodeWidth) / 2, currentY + 5);
    } else {
      // Fallback jika getTextWidth tidak tersedia
      this.doc.text(periode, this.pageWidth / 2, currentY + 5, { align: 'center' });
    }
    currentY += 20;
    
    // Siapkan data untuk tabel dengan nomor urut
    const tableData = reportData.map((item, index) => {
      const formattedItem = { ...item, no: index + 1 };
      
      // Format data khusus untuk inventaris
      if (reportTitle.includes('INVENTARIS')) {
        formattedItem.kategori = item.kategori?.nama || item.kategori || '-';
        formattedItem.lokasi = item.lokasi?.nama || item.lokasi || '-';
        formattedItem.kondisi = {
          'baik': 'Baik',
          'rusak_ringan': 'Rusak Ringan', 
          'rusak_berat': 'Rusak Berat'
        }[item.kondisi] || item.kondisi || '-';
        formattedItem.status = {
          'tersedia': 'Tersedia',
          'dipinjam': 'Dipinjam',
          'dalam_perbaikan': 'Dalam Perbaikan'
        }[item.status] || item.status || '-';
        formattedItem.tanggal_perolehan = item.tanggal_perolehan ? 
          new Date(item.tanggal_perolehan).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long', 
            year: 'numeric'
          }) : '-';
      }
      
      return formattedItem;
    });
    
    // Debug: Log data yang akan ditampilkan
    console.log('Report Data:', reportData);
    console.log('Columns:', columns);
    console.log('Table Data:', tableData);
    
    // Tambahkan tabel menggunakan autoTable
    let tableEndY = currentY + 100; // Default fallback position
    
    // Pastikan this.doc tersedia dan valid
    if (!this.doc) {
      throw new Error('PDF document not initialized');
    }
    
    // Pastikan semua method yang diperlukan tersedia
    if (typeof this.doc.setFont !== 'function' || 
        typeof this.doc.setFontSize !== 'function' ||
        typeof this.doc.text !== 'function' ||
        typeof this.doc.autoTable !== 'function') {
      throw new Error('Required PDF methods not available');
    }
    
    // Pastikan data tidak kosong
    if (!tableData || tableData.length === 0) {
      this.doc.setFont('times', 'normal');
      this.doc.setFontSize(12);
      this.doc.text('Tidak ada data untuk ditampilkan', this.margins.left, currentY);
      tableEndY = currentY + 20;
    } else {
      // Buat tabel dengan autoTable
      try {
        console.log('About to call autoTable...');
        console.log('this.doc methods available:', {
          autoTable: typeof this.doc.autoTable,
          setFont: typeof this.doc.setFont,
          setFontSize: typeof this.doc.setFontSize,
          getFontSize: typeof this.doc.getFontSize
        });
        
        this.doc.autoTable({
        startY: currentY,
        head: [columns.map(col => col.header)],
        body: tableData.map(row => columns.map(col => row[col.dataKey] || '-')),
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          halign: 'left'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { 
          left: this.margins.left, 
          right: this.margins.right 
        },
        theme: 'grid',
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 10 }, // No column
          1: { cellWidth: 'auto' }, // Other columns auto width
        }
      });
      
      console.log('autoTable call completed successfully');
      
      // Get the actual end position of the table
      if (this.doc.lastAutoTable && this.doc.lastAutoTable.finalY) {
        tableEndY = this.doc.lastAutoTable.finalY;
      }
      
      } catch (autoTableError) {
        console.error('Error in autoTable call:', autoTableError);
        console.error('autoTable error stack:', autoTableError.stack);
        
        // Fallback: create simple text table
        this.doc.setFont('times', 'normal');
        this.doc.setFontSize(10);
        this.doc.text('Error creating table. Data available but table generation failed.', this.margins.left, currentY);
        tableEndY = currentY + 20;
      }
    }
    
    // Tambahkan footer dengan tanggal cetak
    const footerY = tableEndY + 20;
    
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(10);
    const printDate = `Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    this.doc.text(printDate, this.margins.left, footerY);
     
     return this.doc;
     
    } catch (error) {
      console.error('Error generating inventory PDF:', error);
      console.error('Error stack:', error.stack);
      console.error('Document state:', this.doc ? 'initialized' : 'not initialized');
      
      // Reset document state on error
      this.doc = null;
      
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Generate laporan umum (untuk peminjaman, kondisi, transaksi)
   async generateGeneralReport(reportData, reportTitle, periode, columns) {
     try {
       console.log('Starting General PDF generation...');
       
       // Reset document jika sudah ada
       this.doc = null;
       
       // Muat logo terlebih dahulu
       await this.loadLogo();
       
       // Inisialisasi dokumen
       await this.initDocument();
       
       console.log('General PDF document initialized successfully');
       
       // Pastikan dokumen terinisialisasi dengan benar
       if (!this.doc) {
         throw new Error('Failed to initialize PDF document');
       }
       
       // Pastikan semua method yang diperlukan tersedia
       if (typeof this.doc.setFont !== 'function' || 
           typeof this.doc.setFontSize !== 'function' ||
           typeof this.doc.text !== 'function') {
         throw new Error('jsPDF methods not available');
       }
       
       // Tambahkan kop surat
       let currentY = this.addHeader(this.margins.top);
       
       // Tambahkan judul laporan
       currentY = this.addTitle(reportTitle, null, currentY + 10);
       
       // Pastikan currentY valid
       if (isNaN(currentY) || currentY < 0) {
         currentY = this.margins.top + 60;
       }
    
    // Tambahkan periode laporan
     this.doc.setFont('times', 'normal');
     this.doc.setFontSize(12);
     this.doc.setTextColor(0, 0, 0);
     
     // Pastikan getTextWidth tersedia
     if (typeof this.doc.getTextWidth === 'function') {
       const periodeWidth = this.doc.getTextWidth(periode);
       this.doc.text(periode, (this.pageWidth - periodeWidth) / 2, currentY + 5);
     } else {
       // Fallback jika getTextWidth tidak tersedia
       this.doc.text(periode, this.pageWidth / 2, currentY + 5, { align: 'center' });
     }
     currentY += 20;
    
    // Siapkan data untuk tabel dengan nomor urut
    const tableData = reportData.map((item, index) => {
      const formattedItem = { ...item, no: index + 1 };
      
      // Format tanggal jika ada
      if (item.tanggal_pinjam) {
        formattedItem.tanggal_pinjam = new Date(item.tanggal_pinjam).toLocaleDateString('id-ID');
      }
      if (item.tanggal_kembali) {
        formattedItem.tanggal_kembali = new Date(item.tanggal_kembali).toLocaleDateString('id-ID');
      }
      if (item.tanggal) {
        formattedItem.tanggal = new Date(item.tanggal).toLocaleDateString('id-ID');
      }
      
      return formattedItem;
    });
    
    // Debug: Log data yang akan ditampilkan
    console.log('General Report Data:', reportData);
    console.log('Columns:', columns);
    console.log('Table Data:', tableData);
    
    // Tambahkan tabel menggunakan autoTable
    let tableEndY = currentY + 100; // Default fallback position
    
    // Pastikan this.doc tersedia dan valid
    if (!this.doc) {
      throw new Error('PDF document not initialized');
    }
    
    // Pastikan semua method yang diperlukan tersedia
    if (typeof this.doc.setFont !== 'function' || 
        typeof this.doc.setFontSize !== 'function' ||
        typeof this.doc.text !== 'function' ||
        typeof this.doc.autoTable !== 'function') {
      throw new Error('Required PDF methods not available');
    }
    
    // Pastikan data tidak kosong
    if (!tableData || tableData.length === 0) {
      this.doc.setFont('times', 'normal');
      this.doc.setFontSize(12);
      this.doc.text('Tidak ada data untuk ditampilkan', this.margins.left, currentY);
      tableEndY = currentY + 20;
    } else {
      // Buat tabel dengan autoTable
      try {
        console.log('About to call autoTable in general report...');
        console.log('this.doc methods available:', {
          autoTable: typeof this.doc.autoTable,
          setFont: typeof this.doc.setFont,
          setFontSize: typeof this.doc.setFontSize,
          getFontSize: typeof this.doc.getFontSize
        });
        
        this.doc.autoTable({
        startY: currentY,
        head: [columns.map(col => col.header)],
        body: tableData.map(row => columns.map(col => row[col.dataKey] || '-')),
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          halign: 'left'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { 
          left: this.margins.left, 
          right: this.margins.right 
        },
        theme: 'grid',
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 10 }, // No column
          1: { cellWidth: 'auto' }, // Other columns auto width
        }
      });
      
      console.log('autoTable call in general report completed successfully');
      
      // Get the actual end position of the table
      if (this.doc.lastAutoTable && this.doc.lastAutoTable.finalY) {
        tableEndY = this.doc.lastAutoTable.finalY;
      }
      
      } catch (autoTableError) {
        console.error('Error in autoTable call (general report):', autoTableError);
        console.error('autoTable error stack:', autoTableError.stack);
        
        // Fallback: create simple text table
        this.doc.setFont('times', 'normal');
        this.doc.setFontSize(10);
        this.doc.text('Error creating table. Data available but table generation failed.', this.margins.left, currentY);
        tableEndY = currentY + 20;
      }
    }
    
    // Tambahkan footer dengan tanggal cetak
    const footerY = tableEndY + 20;
    
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(10);
    const printDate = `Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    this.doc.text(printDate, this.margins.left, footerY);
     
     return this.doc;
     
    } catch (error) {
      console.error('Error generating general PDF:', error);
      console.error('Error stack:', error.stack);
      console.error('Document state:', this.doc ? 'initialized' : 'not initialized');
      
      // Reset document state on error
      this.doc = null;
      
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}

export default PDFGenerator;