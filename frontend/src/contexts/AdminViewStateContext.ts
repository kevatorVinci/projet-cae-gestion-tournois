import { createContext } from 'react';

export interface AdminViewContextType {
  isAdminView: boolean;
  setIsAdminView: (value: boolean) => void;
  toggleAdminView: () => void;
}

export const AdminViewContext = createContext<AdminViewContextType | undefined>(
  undefined,
);
