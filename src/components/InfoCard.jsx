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
      <CardContent sx={{ flex: 1, zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              width: 48,
              height: 48,
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