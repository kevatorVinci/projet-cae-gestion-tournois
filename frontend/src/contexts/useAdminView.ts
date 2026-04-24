import { useContext } from 'react';
import {
  AdminViewContext,
  AdminViewContextType,
} from './AdminViewStateContext';

export const useAdminView = (): AdminViewContextType => {
  const context = useContext(AdminViewContext);
  if (!context) {
    throw new Error('useAdminView must be used within AdminViewProvider');
  }
  return context;
};
