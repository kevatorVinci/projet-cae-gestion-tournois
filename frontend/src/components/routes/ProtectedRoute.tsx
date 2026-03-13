import { ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authenticatedUser }: UserContextType = useContext(UserContext);

  if (!authenticatedUser?.token) {
    return <Navigate to="/pas-acces/non-connecte" replace />;
  }

  return <>{children}</>;
}
