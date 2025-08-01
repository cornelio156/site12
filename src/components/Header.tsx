import { useContext } from 'react';
import type { FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../services/Auth';
import { useSiteConfig } from '../context/SiteConfigContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Chip from '@mui/material/Chip';

const Header: FC = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const { user, logout, isAuthenticated } = useAuth();
  const { siteName } = useSiteConfig();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear session if logout fails
      localStorage.removeItem('sessionToken');
      window.location.reload();
    }
  };

  // Only show admin/logout if authenticated
  const showAdminControls = isAuthenticated && user;

  return (
    <AppBar 
      position="sticky"
      sx={{
        bgcolor: mode === 'dark' ? '#0A0A0A' : '#121212',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      <Toolbar>
        {/* Site Logo/Name */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(to right, #FF0F50 0%, #D10D42 100%)',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              mr: 1,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                color: 'white',
              }}
            >
              {siteName.split(' ')[0]}
              <Box 
                component="span" 
                sx={{ 
                  color: 'white',
                  fontWeight: 400,
                  ml: 0.5
                }}
              >
                {siteName.split(' ').slice(1).join(' ')}
              </Box>
            </Typography>
          </Box>
          
          <Chip 
            label="18+" 
            size="small"
            sx={{ 
              ml: 1, 
              bgcolor: '#FF0F50', 
              color: 'white', 
              fontWeight: 'bold',
              height: '22px',
              fontSize: '0.7rem'
            }} 
          />
        </Box>
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/"
            sx={{ 
              mr: 1,
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255, 15, 80, 0.1)'
              }
            }}
          >
            Home
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/videos"
            sx={{ 
              mr: 1,
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255, 15, 80, 0.1)'
              }
            }}
          >
            Videos
          </Button>
          
          {/* Show admin button if authenticated */}
          {showAdminControls && (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/admin"
                startIcon={<PersonIcon />}
                sx={{ 
                  mr: 1,
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255, 15, 80, 0.1)'
                  }
                }}
              >
                Admin
              </Button>
              
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255, 15, 80, 0.1)'
                  } 
                }} 
                aria-label="logout"
              >
                <LogoutIcon />
              </IconButton>
            </>
          )}
          
          {/* Theme toggle */}
          <IconButton 
            color="inherit" 
            onClick={toggleTheme} 
            sx={{ 
              ml: 1,
              color: '#FF69B4',
              '&:hover': {
                bgcolor: 'rgba(255, 15, 80, 0.1)'
              }
            }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
