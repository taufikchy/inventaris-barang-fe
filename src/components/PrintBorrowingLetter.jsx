import { forwardRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const PrintContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: '#fff',
  color: '#000',
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  '@media print': {
    width: '100%',
    height: 'auto',
    margin: 0,
    padding: 0,
  },
}));

const LetterHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  borderBottom: '2px solid #000',
  paddingBottom: theme.spacing(2),
}));

const Logo = styled('div')(({ theme }) => ({
  width: 80,
  height: 80,
  marginRight: theme.spacing(2),
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    maxWidth: '100%',
    maxHeight: '100%',
  },
}));

const SchoolInfo = styled(Box)({
  flexGrow: 1,
});

const SignatureSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(6),
}));

const SignatureBox = styled(Box)(({ theme }) => ({
  width: '30%',
  textAlign: 'center',
}));

const PrintBorrowingLetter = forwardRef(({ peminjaman }, ref) => {
  if (!peminjaman) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const today = formatDate(new Date().toISOString());

  return (
    <PrintContainer ref={ref}>
      <LetterHeader>
        <Logo>
          <Typography variant="body2">LOGO</Typography>
        </Logo>
        <SchoolInfo>
          <Typography variant="h5" fontWeight="bold">
            SEKOLAH MENENGAH KEJURUAN
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            LABORATORIUM KOMPUTER
          </Typography>
          <Typography variant="body2">
            Jl. Pendidikan No. 123, Kota, Provinsi, Kode Pos
          </Typography>
          <Typography variant="body2">
            Telp: (021) 1234567 | Email: info@smk.sch.id
          </Typography>
        </SchoolInfo>
      </LetterHeader>

      <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
        SURAT PEMINJAMAN BARANG
      </Typography>
      <Typography variant="h6" align="center" gutterBottom>
        Nomor: {peminjaman.kode}
      </Typography>

      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="body1" paragraph>
          Yang bertanda tangan di bawah ini:
        </Typography>

        <Box sx={{ ml: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Nama
            </Typography>
            <Typography variant="body1">: Kepala Laboratorium</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Jabatan
            </Typography>
            <Typography variant="body1">: Kepala Laboratorium</Typography>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          Dengan ini menyetujui peminjaman barang kepada:
        </Typography>

        <Box sx={{ ml: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Nama Peminjam
            </Typography>
            <Typography variant="body1">: {peminjaman.nama_peminjam}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Kontak Peminjam
            </Typography>
            <Typography variant="body1">: {peminjaman.kontak_peminjam}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Kelas
            </Typography>
            <Typography variant="body1">: {peminjaman.kelas_peminjam}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Tanggal Peminjaman
            </Typography>
            <Typography variant="body1">: {formatDate(peminjaman.tanggal_pinjam)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Tanggal Pengembalian Harapan
            </Typography>
            <Typography variant="body1">: {formatDate(peminjaman.tanggal_kembali_harapan)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Typography variant="body1" sx={{ width: 200 }}>
              Catatan
            </Typography>
            <Typography variant="body1">: {peminjaman.catatan || '-'}</Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="body1" paragraph>
        Dengan daftar barang sebagai berikut:
      </Typography>

      <Paper elevation={0} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">No</TableCell>
              <TableCell>Kode Barang</TableCell>
              <TableCell>Nama Barang</TableCell>
              <TableCell align="center">Jumlah</TableCell>
              <TableCell>Kondisi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peminjaman.DetailPeminjaman?.map((detail, index) => (
              <TableRow key={index}>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell>{detail.Barang?.kode_barang}</TableCell>
                <TableCell>{detail.Barang?.nama_barang}</TableCell>
                <TableCell align="center">{detail.jumlah}</TableCell>
                <TableCell>{detail.kondisi_saat_pinjam || 'Baik'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="body1" paragraph>
        Dengan ketentuan sebagai berikut:
      </Typography>
      <Box sx={{ ml: 4, mb: 4 }}>
        <Typography variant="body2" paragraph>
          1. Peminjam bertanggung jawab penuh atas barang yang dipinjam.
        </Typography>
        <Typography variant="body2" paragraph>
          2. Peminjam wajib mengembalikan barang dalam kondisi baik seperti saat dipinjam.
        </Typography>
        <Typography variant="body2" paragraph>
          3. Jika terjadi kerusakan atau kehilangan, peminjam wajib mengganti atau memperbaiki barang tersebut.
        </Typography>
        <Typography variant="body2" paragraph>
          4. Peminjam wajib mengembalikan barang sesuai dengan tanggal pengembalian yang telah ditentukan.
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <Typography variant="body1">Kota, {today}</Typography>
      </Box>

      <SignatureSection>
        <SignatureBox>
          <Typography variant="body1">Peminjam,</Typography>
          <Box sx={{ height: 80 }}></Box>
          <Typography variant="body1">{peminjaman.peminjam}</Typography>
          <Divider sx={{ width: '80%', margin: '0 auto', mt: 1 }} />
        </SignatureBox>

        <SignatureBox>
          <Typography variant="body1">Mengetahui,</Typography>
          <Box sx={{ height: 80 }}></Box>
          <Typography variant="body1">Admin</Typography>
          <Divider sx={{ width: '80%', margin: '0 auto', mt: 1 }} />
        </SignatureBox>

        <SignatureBox>
          <Typography variant="body1">Menyetujui,</Typography>
          <Box sx={{ height: 80 }}></Box>
          <Typography variant="body1">Kepala Laboratorium</Typography>
          <Divider sx={{ width: '80%', margin: '0 auto', mt: 1 }} />
        </SignatureBox>
      </SignatureSection>
    </PrintContainer>
  );
});

export default PrintBorrowingLetter;