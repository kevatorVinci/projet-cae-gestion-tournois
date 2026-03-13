import '@testing-library/jest-dom';
import React, { type ReactNode } from 'react';
import { vi } from 'vitest';

// MUI X date pickers trigger a Node ESM resolution issue in Vitest CI.
// Mocking them keeps unit tests focused on app behavior.
vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: { children: ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: () => null,
}));

vi.mock('@mui/x-date-pickers/AdapterDayjs', () => ({
  AdapterDayjs: class AdapterDayjsMock {},
}));
