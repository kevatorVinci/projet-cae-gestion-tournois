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
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
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
            <Button color="inherit" onClick={() => navigate('/')}>
              Accueil
            </Button>
            <Button color="inherit" onClick={() => navigate('/tournois')}>
              Tournois
            </Button>
            <Button color="inherit" onClick={() => navigate('/equipes')}>
              Teams
            </Button>
            {authenticatedUser && hasTeam && (
              <Button color="inherit" onClick={() => navigate('/maTeam')}>
                MaTeam
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              color="inherit"
              onClick={() => navigate('/admin/tournaments')}
            >
              Gestion des tournois
            </Button>
            <Button color="inherit" onClick={() => navigate('/admin')}>
              Admin
            </Button>
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
                  <NotificationsNoneIcon />
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
                  border: '2px solid white',
                  transition: 'transform 0.2s',
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
