import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { UserContext } from './contexts/UserContext';
import { AuthenticatedUser, UserContextType } from './types';

function createAuthenticatedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    email: 'joueur@vinci.be',
    token: 'header.eyJpZCI6MSwiZXhwIjo0MTAyNDQ0ODAwfQ.signature',
    admin: false,
    tag: 'JoueurTest',
    ...overrides,
  };
}

function createMockUserContext(
  overrides: Partial<UserContextType> = {},
): UserContextType {
  return {
    authenticatedUser: undefined,
    registerUser: vi.fn(async () => {}),
    loginUser: vi.fn(async () => {}),
    clearUser: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  };
}

function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    userContext = createMockUserContext(),
  }: {
    route?: string;
    userContext?: UserContextType;
  } = {},
) {
  return render(
    <UserContext.Provider value={userContext}>
      <MemoryRouter
        initialEntries={[route]}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {ui}
      </MemoryRouter>
    </UserContext.Provider>,
  );
}

export { createAuthenticatedUser, createMockUserContext, renderWithProviders };
