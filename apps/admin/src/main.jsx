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
    primary: { main: '#0d3b66' },
    secondary: { main: '#3a506b' },
    background: {
      default: '#eef3f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#102a43',
      secondary: '#486581',
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
          backgroundColor: '#f6f8fb',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #d9e2ec',
          boxShadow: '0 14px 32px rgba(16, 42, 67, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #d9e2ec',
          boxShadow: '0 16px 32px rgba(16, 42, 67, 0.1)',
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
          backgroundColor: '#f0f4f8',
          fontWeight: 800,
          color: '#243b53',
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
