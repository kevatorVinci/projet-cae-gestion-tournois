import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Avatar,
  Badge,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../../assets/images/logo.png';
import { UserContext } from '../../contexts/UserContext';
import { useAdminView } from '../../contexts/useAdminView';
import { UserContextType } from '../../types';
import { getUserTeam } from '../../services/teams';
import {
  getCurrentUserIdFromToken,
  getUnreadNotificationsByUser,
} from '../../services/notifications';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticatedUser, clearUser }: UserContextType =
    useContext(UserContext);
  const {
    isAdminView,
    setIsAdminView,
    toggleAdminView: contextToggle,
  } = useAdminView();
  const [hasTeam, setHasTeam] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const normalizeAvatarUrl = (avatar?: string) => {
    if (!avatar) return '/luffy.png';
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return avatar.startsWith('/') ? avatar : `/${avatar}`;
  };

  useEffect(() => {
    const refreshTeamStatus = () => {
      if (!authenticatedUser) {
        setHasTeam(false);
        return;
      }
      getUserTeam()
        .then((team) => setHasTeam(!!team))
        .catch(() => setHasTeam(false));
    };

    refreshTeamStatus();

    const handleTeamMembershipChanged = () => {
      refreshTeamStatus();
    };

    window.addEventListener(
      'team-membership-changed',
      handleTeamMembershipChanged,
    );

    if (authenticatedUser) {
      try {
        const userId = getCurrentUserIdFromToken();
        getUnreadNotificationsByUser(userId)
          .then((unread) => setUnreadCount(unread.length))
          .catch(() => setUnreadCount(0));
      } catch {
        setUnreadCount(0);
      }
    } else {
      setUnreadCount(0);
    }

    return () => {
      window.removeEventListener(
        'team-membership-changed',
        handleTeamMembershipChanged,
      );
    };
  }, [authenticatedUser, location.pathname]);

  const handleLogout = () => {
    setIsAdminView(false);
    navigate('/', { replace: true });
    setTimeout(() => {
      clearUser();
    }, 0);
  };

  const toggleAdminView = () => {
    contextToggle();
    if (!isAdminView) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const isActive = (path: string, exact = false) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    if (exact) {
      return location.pathname === path;
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a2540' }}>
      <Toolbar>
        {/* --- PARTIE GAUCHE : LE LOGO ET LE BADGE ADMIN --- */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img
            src={logo}
            alt="Vinci Arena"
            style={{ height: '48px', cursor: 'pointer', marginRight: '8px' }}
            onClick={() => {
              setIsAdminView(false);
              navigate('/');
            }}
          />
          {isAdminView && (
            <Chip
              label="ADMIN"
              sx={{
                backgroundColor: '#e8822a',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px',
                height: '24px',
              }}
            />
          )}
        </Box>

        {/* --- Spacer that pushes the rest to the right (as in the original code) --- */}
        <Typography sx={{ flexGrow: 1 }} />

        {/* --- TABS (right-aligned) --- */}
        {!isAdminView ? (
          <>
            {[
              { label: 'Accueil', path: '/' },
              { label: 'Tournois', path: '/tournois' },
              { label: 'Teams', path: '/equipes' },
              ...(authenticatedUser && hasTeam
                ? [{ label: 'MaTeam', path: '/maTeam' }]
                : []),
            ].map(({ label, path }) => (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={{
                  position: 'relative',
                  color: isActive(path) ? '#e8822a' : 'white',
                  fontWeight: isActive(path) ? 700 : 400,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 6,
                    left: '20%',
                    width: '60%',
                    height: '2px',
                    borderRadius: '2px',
                    backgroundColor: '#e8822a',
                    opacity: isActive(path) ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </>
        ) : (
          <>
            {[
              {
                label: 'Gestion des tournois',
                path: '/admin/tournaments',
                exact: false,
              },
              { label: 'Admin', path: '/admin', exact: true },
            ].map(({ label, path, exact }) => (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={{
                  position: 'relative',
                  color: isActive(path, exact) ? '#e8822a' : 'white',
                  fontWeight: isActive(path, exact) ? 700 : 400,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 6,
                    left: '20%',
                    width: '60%',
                    height: '2px',
                    borderRadius: '2px',
                    backgroundColor: '#e8822a',
                    opacity: isActive(path, exact) ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </>
        )}

        {/* --- PROFILE BUTTONS (always right-aligned, next to tabs) --- */}
        {!authenticatedUser ? (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Connexion
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: '#e8822a',
                color: '#ffffff',
                marginLeft: 1,
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Inscription
            </Button>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginLeft: 2,
            }}
          >
            {authenticatedUser?.admin && (
              <Button
                variant="outlined"
                startIcon={
                  isAdminView ? (
                    <LogoutIcon sx={{ transform: 'rotate(180deg)' }} />
                  ) : (
                    <AdminPanelSettingsIcon />
                  )
                }
                onClick={toggleAdminView}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  textTransform: 'none',
                  mr: 1,
                  '&:hover': {
                    borderColor: '#e8822a',
                    backgroundColor: 'rgba(232, 130, 42, 0.1)',
                  },
                }}
              >
                {isAdminView ? 'Vue Joueur' : 'Vue Admin'}
              </Button>
            )}

            {!isAdminView && (
              <Badge
                badgeContent={unreadCount > 0 ? '●' : 0}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ef4444',
                    color: '#ef4444',
                    fontSize: '0.4rem',
                    minWidth: '8px',
                    height: '8px',
                    padding: '0',
                    right: '0px',
                    top: '4px',
                  },
                }}
              >
                <IconButton
                  color="inherit"
                  aria-label="notifications"
                  onClick={() => navigate('/notifications')}
                >
                  <NotificationsIcon
                    sx={{
                      color: isActive('/notifications')
                        ? '#e8822a'
                        : 'rgba(255,255,255,0.7)',
                      transition: 'color 0.2s',
                    }}
                  />
                </IconButton>
              </Badge>
            )}

            <IconButton onClick={() => navigate('/profil')} sx={{ p: 0 }}>
              <Avatar
                alt="Profil du joueur"
                src={normalizeAvatarUrl(authenticatedUser?.profileImage)}
                imgProps={{
                  onError: (event) => {
                    event.currentTarget.src = '/luffy.png';
                  },
                }}
                sx={{
                  width: 45,
                  height: 45,
                  border: isActive('/profil')
                    ? '2px solid #e8822a'
                    : '2px solid rgba(255,255,255,0.4)',
                  boxShadow: isActive('/profil')
                    ? '0 0 0 3px rgba(232,130,42,0.25)'
                    : 'none',
                  transition:
                    'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              />
            </IconButton>

            {/* Sign-out button, always visible */}
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                backgroundColor: '#e8822a',
                color: '#ffffff',
                marginLeft: 1,
                '&:hover': { backgroundColor: '#c86e20' },
              }}
            >
              Se déconnecter
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
