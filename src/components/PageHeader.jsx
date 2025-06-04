import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const PageHeader = ({
  title,
  actionText,
  actionIcon,
  onActionClick,
  breadcrumbs = [],
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        {actionText && onActionClick && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onActionClick}
            sx={{ px: 3 }}
          >
            {actionText}
          </Button>
        )}
      </Box>

      {/* Optional children content */}
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
};

export default PageHeader;