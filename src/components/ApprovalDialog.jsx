import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const ApprovalDialog = ({
  open,
  onClose,
  onApprove,
  loading,
  peminjamanId,
}) => {
  const [status, setStatus] = useState('disetujui');
  const [catatan, setCatatan] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setFileError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
        setFile(null);
        return;
      }

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError('Ukuran file terlalu besar. Maksimal 5MB.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setFileError('');
    }
  };

  const handleSubmit = () => {
    // Tidak perlu upload file saat approval, karena surat sudah dicetak dan ditandatangani secara manual
    const approvalData = {
      status: status,
      catatan_persetujuan: catatan
    };

    onApprove(approvalData);
  };

  const handleClose = () => {
    setStatus('disetujui');
    setCatatan('');
    setFile(null);
    setFileError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? null : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Persetujuan Peminjaman</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Status Persetujuan</FormLabel>
            <RadioGroup
              row
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <FormControlLabel
                value="disetujui"
                control={<Radio />}
                label="Disetujui"
              />
              <FormControlLabel
                value="ditolak"
                control={<Radio />}
                label="Ditolak"
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <TextField
          label="Catatan Persetujuan"
          multiline
          rows={4}
          fullWidth
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          margin="normal"
          placeholder={status === 'ditolak' ? 'Berikan alasan penolakan' : 'Catatan tambahan (opsional)'}
        />

        {status === 'disetujui' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Pastikan surat pengajuan peminjaman sudah dicetak dan ditandatangani sebelum menyetujui peminjaman ini.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={status === 'disetujui' ? 'primary' : 'error'}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {status === 'disetujui' ? 'Setujui' : 'Tolak'} Peminjaman
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalDialog;