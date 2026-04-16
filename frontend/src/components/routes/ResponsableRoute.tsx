import { ReactNode, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';
import { isCurrentUserResponsable } from '../../services/teams';

type ResponsableRouteProps = {
  children: ReactNode;
};

export default function ResponsableRoute({ children }: ResponsableRouteProps) {
  const { authenticatedUser }: UserContextType = useContext(UserContext);
  const [isResponsable, setIsResponsable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authenticatedUser?.token) {
      setIsResponsable(false);
      return;
    }

    let isMounted = true;

    const checkResponsableStatus = async () => {
      const value = await isCurrentUserResponsable();
      if (isMounted) {
        setIsResponsable(value);
      }
    };

    checkResponsableStatus();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser?.token]);

  if (!authenticatedUser?.token) {
    return <Navigate to="/pas-acces/non-connecte" replace />;
  }

  if (isResponsable === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (!isResponsable) {
    return <Navigate to="/pas-acces/interdit" replace />;
  }

  return <>{children}</>;
}
