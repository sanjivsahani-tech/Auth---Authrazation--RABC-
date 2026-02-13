import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { api } from '../api/client';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/dashboard/summary')).data.data,
  });

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Executive Dashboard</Typography>
        <Chip label="Live" color="primary" variant="outlined" />
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
              <Typography variant="h3">{data?.userCount ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Roles</Typography>
              <Typography variant="h3">{data?.roleCount ?? '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
