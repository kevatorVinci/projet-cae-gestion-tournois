import React, { useCallback, useState } from 'react';
import { AdminViewContext } from './AdminViewStateContext';

export const AdminViewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAdminView, setIsAdminView] = useState(false);

  const toggleAdminView = useCallback(() => {
    setIsAdminView((prev) => !prev);
  }, []);

  return (
    <AdminViewContext.Provider
      value={{ isAdminView, setIsAdminView, toggleAdminView }}
    >
      {children}
    </AdminViewContext.Provider>
  );
};
