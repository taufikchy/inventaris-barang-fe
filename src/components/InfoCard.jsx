import { Box, Card, CardContent, Typography, Avatar } from '@mui/material';

const InfoCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ flex: 1, zIndex: 1, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              alignSelf: { xs: 'center', sm: 'flex-start' }
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -15,
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: `${color}.light`,
          opacity: 0.1,
          zIndex: 0,
        }}
      />
    </Card>
  );
};

export default InfoCard;