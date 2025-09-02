import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const AlertDialog = ({
  open,
  title = 'Peringatan',
  message,
  buttonText = 'OK',
  onClose,
  severity = 'warning', // 'error', 'warning', 'info', 'success'
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Alert severity={severity} sx={{ mb: 2 }}>
          <AlertTitle>Informasi</AlertTitle>
          {message}
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color={severity === 'error' ? 'error' : 'primary'}
          autoFocus
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;