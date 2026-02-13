import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canSignup, setCanSignup] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { signupAdmin, getSignupStatus } = useAuth();

  useEffect(() => {
    async function loadSignupStatus() {
      try {
        const status = await getSignupStatus();
        setCanSignup(status);
        if (!status) {
          navigate('/login', { replace: true });
        }
      } catch {
        setError('Unable to check signup status');
      } finally {
        setStatusLoading(false);
      }
    }
    loadSignupStatus();
  }, [getSignupStatus, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signupAdmin({ name, email, phone, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'SIGNUP_CLOSED') {
        setError('Signup is closed. Please login.');
        navigate('/login', { replace: true });
      } else {
        setError(err.response?.data?.message || 'Signup failed');
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
      <Card sx={{ width: 500, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #0b7285 0%, #0d3b66 100%)', color: '#fff' }}>
          <Typography variant="overline" sx={{ opacity: 0.85 }}>Initial Setup</Typography>
          <Typography variant="h5">Create Super Admin</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>Register the first administrator for secure platform control.</Typography>
        </Box>
        <Divider />
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Admin Registration</Typography>
          {statusLoading && <Alert severity="info" sx={{ mb: 2 }}>Checking signup status...</Alert>}
          {!statusLoading && !canSignup && <Alert severity="warning" sx={{ mb: 2 }}>Signup closed. Please login.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            <Button type="submit" variant="contained" disabled={loading || !canSignup || statusLoading}>
              {loading ? 'Please wait...' : 'Signup and Continue'}
            </Button>
            <Button component={Link} to="/login" variant="text">Back to Login</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
