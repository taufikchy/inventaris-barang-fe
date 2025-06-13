import { Box, Typography, Button, Breadcrumbs, Link, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const PageHeader = ({
  title,
  actionText,
  actionIcon,
  onActionClick,
  breadcrumbs = [],
  children,
  backButton = false,
  onBackClick,
  actionButton,
}) => {
  return (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          <Link
            component={RouterLink}
            to="/dashboard"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary">
                {crumb.text}
              </Typography>
            ) : (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.link}
                underline="hover"
                color="inherit"
              >
                {crumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header with title and action button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {backButton && onBackClick && (
            <IconButton
              onClick={onBackClick}
              sx={{ 
                mr: 1,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {actionText && onActionClick && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={onActionClick}
              sx={{ 
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                alignSelf: { xs: 'stretch', sm: 'auto' }
              }}
            >
              {actionText}
            </Button>
          )}
          {actionButton && (
            <Button
              variant="contained"
              color={actionButton.color || 'primary'}
              startIcon={actionButton.icon}
              onClick={actionButton.onClick}
              sx={{ 
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                alignSelf: { xs: 'stretch', sm: 'auto' }
              }}
            >
              {actionButton.text}
            </Button>
          )}
        </Box>
      </Box>

      {/* Optional children content */}
      {children && <Box sx={{ mt: { xs: 1, sm: 2 } }}>{children}</Box>}
    </Box>
  );
};

export default PageHeader;