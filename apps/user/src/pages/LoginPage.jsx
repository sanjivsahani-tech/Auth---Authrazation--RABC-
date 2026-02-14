import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const canSubmit = useMemo(() => email && password, [email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        backgroundColor: '#f6f8f8',
      }}
    >
      <Card sx={{ width: 460, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #125b50 0%, #2f6f66 100%)', color: '#fff' }}>
          <Typography variant="overline" sx={{ opacity: 0.85 }}>Workspace Access</Typography>
          <Typography variant="h5">User Operations Portal</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Sign in to manage products, customers, and inventory.</Typography>
        </Box>
        <Divider />
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Sign In</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" disabled={!canSubmit || loading}>{loading ? 'Please wait...' : 'Login'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
