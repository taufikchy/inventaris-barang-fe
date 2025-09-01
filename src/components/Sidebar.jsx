import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  SwapHoriz as SwapHorizIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = ({ open, setOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isAdminOrKepalaLab, isKepalaLab, isAdminToolmanOrKepalaLab, isAdminToolmanKepalaLabOrSarana } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));



  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Barang',
      icon: <InventoryIcon />,
      path: '/barang',
    },
    {
      text: 'Kategori',
      icon: <CategoryIcon />,
      path: '/kategori',
    },
    {
      text: 'Lokasi',
      icon: <LocationIcon />,
      path: '/lokasi',
    },
    {
      text: 'Peminjaman',
      icon: <SwapHorizIcon />,
      path: '/peminjaman',
    },
    {
      text: 'Histori Aktivitas',
      icon: <HistoryIcon />,
      path: '/histori-aktivitas',
    },
    {
      text: 'Laporan',
      icon: <AssessmentIcon />,
      path: '/laporan',
    },
  ];

  // Admin only menu items
  const adminMenuItems = [
    {
      text: 'Pengguna',
      icon: <PeopleIcon />,
      path: '/pengguna',
    },
  ];

  const drawer = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Inventaris Barang
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                borderRadius: '0 20px 20px 0',
                mr: 1,
                mt: 0.5,
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'primary.main',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        {isAdminToolmanKepalaLabOrSarana() && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {(() => {
                if (isKepalaLab()) return 'KEPALA LAB';
                if (user?.peran === 'toolman') return 'TOOLMAN';
                if (user?.peran === 'sarana') return 'SARANA';
                return 'ADMIN';
              })()}
            </Typography>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setOpen(false);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    borderRadius: '0 20px 20px 0',
                    mr: 1,
                    mt: 0.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'white' : 'primary.main',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: open ? drawerWidth : 0 }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px dashed rgba(145, 158, 171, 0.24)',
            boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.16)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;