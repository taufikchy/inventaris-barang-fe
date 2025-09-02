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
      <DialogTitle sx={{
        fontSize: { xs: '1.1rem', sm: '1.25rem' },
        padding: { xs: '12px 16px', sm: '16px 24px' }
      }}>Persetujuan Peminjaman</DialogTitle>
      <DialogContent sx={{
        padding: { xs: '8px 16px', sm: '16px 24px' }
      }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>Status Persetujuan</FormLabel>
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
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
              <FormControlLabel
                value="ditolak"
                control={<Radio />}
                label="Ditolak"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <TextField
          label="Catatan Persetujuan"
          multiline
          rows={{ xs: 3, sm: 4 }}
          fullWidth
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          margin="normal"
          placeholder={status === 'ditolak' ? 'Berikan alasan penolakan' : 'Catatan tambahan (opsional)'}
          sx={{
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        />

        {status === 'disetujui' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Pastikan surat pengajuan peminjaman sudah dicetak dan ditandatangani sebelum menyetujui peminjaman ini.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 },
        padding: { xs: '8px 16px', sm: '8px 24px' }
      }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={status === 'disetujui' ? 'primary' : 'error'}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {status === 'disetujui' ? 'Setujui' : 'Tolak'} Peminjaman
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalDialog;