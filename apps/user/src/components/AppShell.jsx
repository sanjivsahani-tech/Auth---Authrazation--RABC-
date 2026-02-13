import {
  AppBar,
  Avatar,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const items = [
  { label: 'Dashboard', to: '/dashboard', perm: 'dashboard:view' },
  { label: 'Categories', to: '/categories', perm: 'categories:view' },
  { label: 'Shelves', to: '/shelves', perm: 'shelves:view' },
  { label: 'Products', to: '/products', perm: 'products:view' },
  { label: 'Customers', to: '/customers', perm: 'customers:view' },
];

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const permissions = new Set(user?.permissions || []);
  const navItems = items.filter((i) => permissions.has(i.perm));
  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: '1px solid #d4e2dd',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.93) 0%, rgba(255,255,255,0.76) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ maxWidth: 1500, width: '100%', mx: 'auto' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main' }}>Atlas User Workspace</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>{initials}</Avatar>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
            <Button variant="outlined" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2.5, maxWidth: 1500, mx: 'auto', p: 2.5 }}>
        <Paper
          sx={{
            p: 1.5,
            alignSelf: 'start',
            position: { xs: 'static', md: 'sticky' },
            top: 86,
            minHeight: { xs: 'auto', md: 'calc(100vh - 106px)' },
            background: 'linear-gradient(180deg, #f8fcfb 0%, #ffffff 100%)',
          }}
        >
          <Typography variant="overline" sx={{ px: 1.5, color: 'text.secondary' }}>Navigation</Typography>
          <List sx={{ mt: 0.5 }}>
            {navItems.map((i) => (
              <ListItemButton
                key={i.to}
                component={Link}
                to={i.to}
                selected={pathname === i.to}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary={i.label} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}
