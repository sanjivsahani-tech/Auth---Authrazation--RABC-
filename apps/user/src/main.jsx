import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#125b50' },
    secondary: { main: '#3a4f57' },
    background: {
      default: '#eef4f3',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2f33',
      secondary: '#516b75',
    },
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.015em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f6f8f8',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #d4e2dd',
          boxShadow: '0 14px 30px rgba(22, 56, 63, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #d4e2dd',
          boxShadow: '0 16px 34px rgba(22, 56, 63, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#ebf2ef',
          fontWeight: 800,
          color: '#2b4c45',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
