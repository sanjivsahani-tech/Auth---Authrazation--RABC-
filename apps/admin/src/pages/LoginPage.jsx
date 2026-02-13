import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canSignup, setCanSignup] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, getSignupStatus } = useAuth();

  const canSubmit = useMemo(() => email && password, [email, password]);

  useEffect(() => {
    async function loadSignupStatus() {
      try {
        const status = await getSignupStatus();
        setCanSignup(status);
      } catch {
        setError('Unable to check signup status');
      } finally {
        setStatusLoading(false);
      }
    }
    loadSignupStatus();
  }, [getSignupStatus]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (canSignup) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'SIGNUP_REQUIRED') {
        setCanSignup(true);
        setError('Admin signup required before login');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
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
        backgroundColor: '#f6f8fb',
      }}
    >
      <Card sx={{ width: 460, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #0d3b66 0%, #1d4f7a 100%)', color: '#fff' }}>
          <Typography variant="overline" sx={{ opacity: 0.85 }}>Enterprise Access</Typography>
          <Typography variant="h5">Admin Control Center</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Secure sign-in for platform operations.</Typography>
        </Box>
        <Divider />
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Sign In</Typography>
          {statusLoading && <Alert severity="info" sx={{ mb: 2 }}>Checking signup status...</Alert>}
          {!statusLoading && canSignup && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              First admin signup required.{' '}
              <Button component={Link} to="/signup" size="small" sx={{ ml: 1 }}>
                Go to Signup
              </Button>
            </Alert>
          )}
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
            <Button type="submit" variant="contained" disabled={!canSubmit || loading || canSignup || statusLoading}>
              {loading ? 'Please wait...' : 'Login'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
