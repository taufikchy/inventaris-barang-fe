// pdf-generator.jsx
import React, { useCallback, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * PDF Generator untuk surat resmi (Surat Permohonan Peminjaman Barang)
 * - Margin 2 cm
 * - Font Arial (fallback Helvetica)
 * - Kop SMKN Manonjaya: bold hanya 2 baris (SMKN & MANONJAYA), email underline
 * - Logo tajam, aspect ratio terjaga (tidak gepeng)
 */

// ---- Font registry (agar addFont tidak diulang-ulang) ----
const FontRegistry = { arial: false };

// Gunakan font bawaan jsPDF untuk mengurangi ukuran file
async function registerArial(doc) {
  // Tidak perlu memuat font TTF eksternal, gunakan helvetica bawaan
  return false; // Selalu fallback ke helvetica
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

class PDFGenerator {
  constructor() {
    this.doc = null;
    this.margins = { top: 20, left: 20, right: 20, bottom: 20 }; // 2 cm semua sisi
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;

    this.logoEl = null;        // HTMLImageElement asli (paling tajam)
    this.logoNatural = null;   // { w, h } dimensi asli logo
    this.logoData = null;      // fallback (dataURL + width/height)

    this.fontFamily = "helvetica"; // gunakan font bawaan untuk ukuran file kecil
  }

  // Inisialisasi dokumen + font
  async initDocument() {
    this.doc = new jsPDF({ 
      orientation: "portrait", 
      unit: "mm", 
      format: "a4",
      compress: true,
      precision: 2
    });

    // Gunakan helvetica bawaan untuk ukuran file yang lebih kecil
    this.fontFamily = "helvetica";
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setFontSize(12);
    return this.doc;
  }

  // Muat logo TANPA resize (pakai <img> asli biar tajam)
  async loadLogo(src = "/images/logo-prov.png") {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.logoEl = img;
        this.logoNatural = {
          w: img.naturalWidth || img.width,
          h: img.naturalHeight || img.height,
        };
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // Fallback: set logo via dataURL bila perlu (opsional dipakai kalau loadLogo gagal)
  async setLogoDataURL(dataURL, widthPx, heightPx) {
    this.logoEl = null;
    this.logoData = { data: dataURL, width: widthPx, height: heightPx };
  }

  // Placeholder logo
  drawLogoPlaceholder(x, y, size) {
    const doc = this.doc;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, size, size, 3, 3, "FD");
    doc.setFont(this.fontFamily, "bold");
    doc.setFontSize(8);
    const cx = x + size / 2;
    const cy = y + size / 2;
    doc.setTextColor(120, 120, 120);
    doc.text("LOGO", cx, cy - 5, { align: "center" });
    doc.text("SMKN", cx, cy, { align: "center" });
    doc.text("MANONJAYA", cx, cy + 5, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  // Fit gambar ke kotak (preserve aspect ratio)
  fitRect(maxW, maxH, srcW, srcH) {
    const r = Math.min(maxW / srcW, maxH / srcH);
    return { w: srcW * r, h: srcH * r };
  }

  // ===== Kop surat (Arial; bold hanya 2 baris; spasi tunggal; email underline; logo tajam) =====
  addHeader(yPos, isNewPage = false) {
    const doc = this.doc;
    const centerX = this.pageWidth / 2;
    let y = yPos;

    // LOGO — fit ke 25x25 mm, preserve aspect ratio, dengan kompresi untuk ukuran file kecil
    const logoBoxW = 25;
    const logoBoxH = 25;
    const logoOffsetX = -3; // geser ke kiri 2 mm (positif kalau ke kanan)
    const logoX = this.margins.left + logoOffsetX;
    const logoY = y+7;

    try {
      if (this.logoEl && this.logoNatural) {
        const { w: dispW, h: dispH } = this.fitRect(
          logoBoxW,
          logoBoxH,
          this.logoNatural.w,
          this.logoNatural.h
        );
        const drawX = logoX + (logoBoxW - dispW) / 2;
        const drawY = logoY + (logoBoxH - dispH) / 2;
        doc.addImage(this.logoEl, "JPEG", drawX, drawY, dispW, dispH, undefined, "FAST");
      } else if (this.logoData?.data && this.logoData.width && this.logoData.height) {
        const { w: dispW, h: dispH } = this.fitRect(
          logoBoxW,
          logoBoxH,
          this.logoData.width,
          this.logoData.height
        );
        const drawX = logoX + (logoBoxW - dispW) / 2;
        const drawY = logoY + (logoBoxH - dispH) / 2;
        doc.addImage(this.logoData.data, "JPEG", drawX, drawY, dispW, dispH, undefined, "FAST");
      } else {
        this.drawLogoPlaceholder(logoX, logoY, logoBoxW);
      }
    } catch (e) {
      console.warn("Gagal menambahkan logo:", e);
      this.drawLogoPlaceholder(logoX, logoY, logoBoxW);
    }

    // TEKS KOP
    doc.setTextColor(0, 0, 0);
    doc.setFont(this.fontFamily, "normal");

    const line14 = 5; // ~single spacing untuk 14pt
    const line16 = 6; // sedikit lebih besar untuk 16pt

    // 1–3 (14pt normal)
    doc.setFontSize(14);
    doc.text("PEMERINTAH DAERAH PROVINSI JAWA BARAT", centerX, y + line14, { align: "center" });
    doc.text("DINAS PENDIDIKAN", centerX, y + line14 * 2, { align: "center" });
    doc.text("CABANG DINAS PENDIDIKAN WILAYAH XII", centerX, y + line14 * 3, { align: "center" });

    // 4–5 (16pt bold — hanya baris ini yang bold)
    doc.setFont(this.fontFamily, "bold");
    doc.setFontSize(16);
    doc.text("SEKOLAH MENENGAH KEJURUAN NEGERI", centerX, y + line14 * 3 + line16, { align: "center" });
    doc.text("MANONJAYA", centerX, y + line14 * 3 + line16 * 2, { align: "center" });

    // setelah judul
    y += line14 * 3 + line16 * 2 + 4;

    // alamat/website/email/kota (10pt), email di-underline
    doc.setFont(this.fontFamily, "normal");
    doc.setFontSize(10);

    const address = "Jalan Gunungtanjung Km. 2,5 Telepon: (0265) 381 767 Faximile: (0265) 381 767";
    doc.text(address, centerX, y, { align: "center" });
    y += 4;

    const prefix = "Website: smknmanonjaya.sch.id e-mail: ";
    const emailText = "smknmanonjaya@yahoo.co.id";
    const fullLine = prefix + emailText;

    const fullW = doc.getTextWidth(fullLine);
    const startX = centerX - fullW / 2;
    const prefixW = doc.getTextWidth(prefix);
    const emailW = doc.getTextWidth(emailText);

    doc.text(prefix, startX, y);
    doc.text(emailText, startX + prefixW, y);

    // underline khusus email
    const ulY = y + 0.8;
    doc.setLineWidth(0.3);
    doc.line(startX + prefixW, ulY, startX + prefixW + emailW, ulY);

    y += 4;

    const city = "Manonjaya-Tasikmalaya 46197";
    doc.text(city, centerX, y, { align: "center" });
    y += 3;

    // garis pembatas ganda
    doc.setLineWidth(0.8);
    doc.line(this.margins.left, y, this.pageWidth - this.margins.right, y);
    doc.setLineWidth(0.3);
    doc.line(this.margins.left, y + 1, this.pageWidth - this.margins.right, y + 1);

    return y + (isNewPage ? 6 : 10);
  }

  // ===== Judul surat =====
  addTitle(title, subtitle, y) {
    const doc = this.doc;
    const centerX = this.pageWidth / 2;
    doc.setFont(this.fontFamily, "bold");
    doc.setFontSize(12);
    doc.text(title, centerX, y, { align: "center" });

    const w = doc.getTextWidth(title);
    const x = (this.pageWidth - w) / 2;
    doc.setLineWidth(0.5);
    doc.line(x, y + 2, x + w, y + 2);

    y += 10;
    if (subtitle) {
      doc.setFont(this.fontFamily, "normal");
      doc.setFontSize(12);
      doc.text(subtitle, centerX, y, { align: "center" });
      y += 8;
    }
    return y + 2;
  }

  // ===== Header surat (Nomor, Lampiran, Perihal) =====
  addOfficialLetterHeader(nomor, lampiran, perihal, y) {
    const doc = this.doc;
    doc.setFont(this.fontFamily, "normal");
    doc.setFontSize(12);

    const labelW = 25;
    const colonX = this.margins.left + labelW;
    const contentX = colonX + 5;

    doc.text("Nomor", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(nomor, contentX, y);
    y += 6;

    doc.text("Lampiran", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(lampiran, contentX, y);
    y += 6;

    doc.text("Perihal", this.margins.left, y);
    doc.text(":", colonX, y);
    const lines = doc.splitTextToSize(perihal, this.contentWidth - labelW - 5);
    doc.text(lines, contentX, y);
    y += lines.length * 6 + 6;

    return y;
  }

  // ===== Isi surat (alamat tujuan, pembuka, identitas peminjam) =====
  addBorrowingLetterContent(peminjaman, y) {
    const doc = this.doc;
    doc.setFont(this.fontFamily, "normal");
    doc.setFontSize(12);

    doc.text("Kepada Yth.", this.margins.left, y);
    y += 6;

    const indent = 15;
    doc.text("Kepala Laboratorium Komputer", this.margins.left + indent, y); y += 6;
    doc.text("SMK Negeri Manonjaya", this.margins.left + indent, y); y += 6;
    doc.text("Di", this.margins.left + indent, y);
    doc.setFont(this.fontFamily, "bold");
    doc.text("Tempat", this.margins.left + indent + 8, y);
    doc.setFont(this.fontFamily, "normal");
    y += 10;

    doc.text("Dengan hormat,", this.margins.left, y);
    y += 8;

    const opening =
      "Bersama ini kami mengajukan permohonan peminjaman barang laboratorium komputer dengan rincian sebagai berikut:";
    // Menggunakan lebar yang sama dengan garis ganda di bawah kop surat
    const textWidth = this.pageWidth - this.margins.left - this.margins.right;
    const wrapped = doc.splitTextToSize(opening, textWidth);
    wrapped.forEach((line, i) => {
        const xPos = this.margins.left; // semua baris mulai dari margin kiri
        doc.text(line, xPos, y, { align: 'justify' });
        y += 6;
      });
      y += 4;

    const labelW = 40;
    const colonX = this.margins.left + labelW;
    const contentX = colonX + 8;

    doc.text("Nama Peminjam", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(peminjaman.nama_peminjam || peminjaman.peminjam || "-", contentX, y);
    y += 6;

    doc.text("Kontak Peminjam", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(peminjaman.kontak_peminjam || peminjaman.kontak || "-", contentX, y);
    y += 6;

    doc.text("Instansi Peminjam", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(peminjaman.kelas_peminjam || peminjaman.kelas || peminjaman.instansi_peminjam || peminjaman.instansi || "-", contentX, y);
    y += 6;

    doc.text("Jabatan Peminjam", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(peminjaman.jabatan_peminjam || peminjaman.jabatan || "-", contentX, y);
    y += 6;

    doc.text("Tanggal Pinjam", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(this.formatDate(peminjaman.tanggal_pinjam), contentX, y);
    y += 6;

    doc.text("Tanggal Kembali", this.margins.left, y);
    doc.text(":", colonX, y);
    doc.text(this.formatDate(peminjaman.rencana_kembali || peminjaman.tanggal_kembali), contentX, y);
    y += 10;

    return y;
  }

  // ===== Tabel barang =====
  addItemsTable(items, y) {
    const doc = this.doc;
    let currentY = this.checkPageBreak(y, 30);



    doc.setFont(this.fontFamily, "normal");
    doc.setFontSize(12);
    doc.text(
      "Adapun barang yang akan dipinjam adalah sebagai berikut:",
      this.margins.left,
      currentY
    );
    currentY += 8;

    const data =
      Array.isArray(items) && items.length
        ? items.map((it, idx) => [
            String(idx + 1),
            it.kode_barang || it.kode || "-",
            it.nama_barang || it.nama || "-",
            it.lokasi_ruangan || it.lokasi || it.ruang || "-",
            it.jumlah || it.qty || "1",
            this.capitalizeFirst(it.kondisi_pinjam || it.kondisi || it.status || "Baik"),
          ])
        : [["1", "-", "-", "-", "-", "-"]];

    autoTable(doc, {
      startX: this.margins.left,
      startY: currentY,
      head: [["No.", "Kode Barang", "Nama Barang", "Lokasi", "Jumlah", "Kondisi Pinjam"]],
      body: data,
      styles: { 
        font: this.fontFamily, 
        fontSize: 9, 
        lineWidth: 0.2, 
        textColor: [0, 0, 0],
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [220, 220, 220], 
        fontStyle: "bold", 
        halign: "center",
        valign: 'middle',
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },     // No.
        1: { cellWidth: 28, halign: "center" },     // Kode Barang
        2: { cellWidth: 60, halign: "left" },       // Nama Barang
        3: { cellWidth: 30, halign: "center" },     // Lokasi
        4: { cellWidth: 15, halign: "center" },     // Jumlah
        5: { cellWidth: 27, halign: "center" },     // Kondisi Pinjam
      },
      margin: { left: this.margins.left, right: this.margins.right },
      theme: "grid",
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.2,
    });

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || currentY + 30;
    return finalY + 8;
  }

  // ===== Ketentuan & Penutup =====
  addTermsAndConditions(y) {
    const doc = this.doc;
    let currentY = this.checkPageBreak(y, 60);

    doc.setFont(this.fontFamily, "normal");
    doc.setFontSize(12);

    const intro = "Dengan ketentuan sebagai berikut:";
    doc.text(intro, this.margins.left, currentY);
    currentY += 6;

    const terms = [
      "Barang yang dipinjam harus dikembalikan dalam kondisi baik dan sesuai dengan spesifikasi awal.",
      "Peminjam bertanggung jawab penuh atas kerusakan atau kehilangan barang selama masa peminjaman.",
      "Pengembalian barang harus sesuai dengan jadwal yang telah disepakati.",
      "Barang yang rusak atau hilang akan dikenakan sanksi sesuai dengan peraturan yang berlaku.",
      "Peminjam wajib menjaga dan merawat barang yang dipinjam selama masa peminjaman.",
    ];

    terms.forEach((t, i) => {
      currentY = this.checkPageBreak(currentY, 12);
      const num = `${i + 1}.`;
      const textWidth = this.pageWidth - this.margins.left - this.margins.right - 12; // space for numbering
      const lines = doc.splitTextToSize(t, textWidth);
      doc.text(num, this.margins.left, currentY);
      lines.forEach((line, lineIndex) => {
        doc.text(line, this.margins.left + 12, currentY + (lineIndex * 6), { align: 'justify', maxWidth: textWidth });
      });
      currentY += lines.length * 6 + 2;
    });

    currentY += 6;
    const closing =
      "Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.";
    const textWidth = this.pageWidth - this.margins.left - this.margins.right;
    const wrapped = doc.splitTextToSize(closing, textWidth);
    wrapped.forEach((line, i) => {
      doc.text(line, this.margins.left, currentY + (i * 6), { align: 'justify' });
    });
    currentY += wrapped.length * 6 + 10;

    return currentY;
  }

  // ===== Tanda tangan =====
  addSignatures(peminjaman, y) {
    const doc = this.doc;
    let currentY = this.checkPageBreak(y, 60);

    const dateText = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const placeDate = `Tasikmalaya, ${dateText}`;
    const w = doc.getTextWidth(placeDate);
    doc.text(placeDate, this.pageWidth - this.margins.right - w, currentY);
    currentY += 12;

    const leftX = this.margins.left + 12;
    const rightX = this.pageWidth - this.margins.right - 60;

    doc.setFont(this.fontFamily, "normal");
    doc.text("Mengetahui,", leftX, currentY);
    doc.text("Kepala Laboratorium Komputer", leftX, currentY + 6);
    doc.text("Pemohon", rightX, currentY + 6);

    currentY += 35; // ruang tanda tangan dan cap

    // Data Kepala Lab
    const kepalaLab = {
      nama: "ABDUL AZIZ, S.KOM",
      jab: "Pembina Utama",
      nip: "10290202019191"
    };

    // Nama (bold + underline, rata kiri)
    doc.setFont(this.fontFamily, "bold");
    doc.text(kepalaLab.nama, leftX, currentY);

    // underline nama
    const nameWidth = doc.getTextWidth(kepalaLab.nama);
    doc.line(leftX, currentY + 0.8, leftX + nameWidth, currentY + 0.8);

    // Jabatan (normal, rata kiri)
    doc.setFont(this.fontFamily, "normal");
    doc.text(kepalaLab.jab, leftX, currentY + 6);

    // NIP (normal, rata kiri)
    doc.text(`NIP. ${kepalaLab.nip}`, leftX, currentY + 12);

    // kanan (peminjam)
    const borrower = peminjaman.nama_peminjam || peminjaman.peminjam || "Nama Peminjam";
    doc.text(borrower, rightX, currentY);

    return currentY + 14;

  }

  // Page break helper
  checkPageBreak(currentY, requiredSpace = 20) {
    if (currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      return this.addHeader(this.margins.top, true);
    }
    return currentY;
  }

  // Format tanggal ID
  formatDate(dateString) {
    if (!dateString) return "-";
    const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", opts);
  }

  // Kapitalisasi huruf pertama
  capitalizeFirst(str) {
    if (!str) return "-";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // ===== Pipeline utama =====
  async generateBorrowingLetter(peminjaman) {
    await this.initDocument();
    await this.loadLogo(); // pastikan file tersedia di /images/logo-smkn-manonjaya.png

    let y = this.addHeader(this.margins.top);

    // Judul
    y = this.addTitle("SURAT PERMOHONAN PEMINJAMAN BARANG", null, y - 2);

    // Header surat
    const nomor = `${peminjaman.kode || "XXX"}/SMK-MNJ/LAB-KOMP/${new Date().getFullYear()}`;
    const lampiran = "-";
    const perihal = "Permohonan Peminjaman Barang Laboratorium";
    y = this.addOfficialLetterHeader(nomor, lampiran, perihal, y + 2);

    // Isi
    y = this.addBorrowingLetterContent(peminjaman, y);

    // Tabel
    const items = peminjaman.DetailPeminjaman || peminjaman.detail_peminjaman || [];
    y = this.addItemsTable(items, y);

    // Ketentuan + penutup
    y = this.addTermsAndConditions(y);

    // Tanda tangan
    y = this.addSignatures(peminjaman, y);

    return this.doc;
  }

  // Simpan atau buka
  savePDF(peminjaman = null, filename = null) {
    if (!filename && peminjaman) {
      // Format: (tanggal cetak dd-mm-yyyy)-SRT-PMJN-BRG-(kode-peminjam)
      const kode = peminjaman.kode || "XXX";
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = String(today.getFullYear()); // Tahun 4 digit
      const tanggal = `${dd}-${mm}-${yyyy}`; // Format: dd-mm-yyyy
      filename = `${tanggal}-SRT-PMJN-BRG-${kode}.pdf`;
    }
    if (!filename) {
      filename = "surat-peminjaman.pdf";
    }
    
    if (this.doc) {
      // Gunakan metode download yang lebih eksplisit dengan kompresi
      const pdfBlob = this.doc.output('blob', { compress: true });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  openPDF() {
    if (this.doc) window.open(this.doc.output("bloburl"), "_blank");
  }

  // Fungsi untuk preview PDF di tab baru dengan nama file yang sesuai
  previewPDF(peminjaman = null) {
    if (!this.doc) return;
    
    // Generate filename untuk preview
    let filename = "surat-peminjaman.pdf";
    if (peminjaman) {
      const kode = peminjaman.kode || "XXX";
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = String(today.getFullYear());
      const tanggal = `${dd}-${mm}-${yyyy}`;
      filename = `${tanggal}-SRT-PMJN-BRG-${kode}.pdf`;
    }
    
    // Buat File object dengan nama yang benar untuk download
    const pdfBlob = this.doc.output('blob', { compress: true });
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    const url = URL.createObjectURL(file);
    
    // Buka PDF langsung di tab baru
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      // Set title tab dengan nama file yang benar
      setTimeout(() => {
        newWindow.document.title = filename;
      }, 100);
    }
    
    // Cleanup URL setelah beberapa detik
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30000);
  }
}

export default PDFGenerator;

/** ====== Komponen tombol opsional ======
 * Pakai ini di React untuk generate & download cepat.
 * <BorrowingLetterButton peminjaman={{ ...data }} />
 */
export function BorrowingLetterButton({ peminjaman, label = "Unduh Surat Peminjaman" }) {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const gen = new PDFGenerator();
      await gen.generateBorrowingLetter(peminjaman || {});
      gen.savePDF(peminjaman);
    } finally {
      setLoading(false);
    }
  }, [peminjaman]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-60"
      type="button"
    >
      {loading ? "Membuat PDF..." : label}
    </button>
  );
}

// Komponen tombol untuk preview PDF
export function BorrowingLetterPreviewButton({ peminjaman, label = "Preview Surat Peminjaman" }) {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const gen = new PDFGenerator();
      await gen.generateBorrowingLetter(peminjaman || {});
      gen.previewPDF(peminjaman);
    } finally {
      setLoading(false);
    }
  }, [peminjaman]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 rounded-md bg-green-600 text-white hover:opacity-90 disabled:opacity-60"
      type="button"
    >
      {loading ? "Membuat Preview..." : label}
    </button>
  );
}