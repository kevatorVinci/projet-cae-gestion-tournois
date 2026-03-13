import { ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

type AdminRouteProps = {
  children: ReactNode;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  if (!authenticatedUser?.token) {
    return <Navigate to="/pas-acces/non-connecte" replace />;
  }

  if (!authenticatedUser.admin) {
    return <Navigate to="/pas-acces/interdit" replace />;
  }

  return <>{children}</>;
}
