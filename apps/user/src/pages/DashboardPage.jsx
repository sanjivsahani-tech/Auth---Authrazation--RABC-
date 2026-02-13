import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { api } from '../api/client';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: async () => (await api.get('/dashboard/summary')).data.data,
  });

  const cards = [
    { label: 'Products', value: data?.products },
    { label: 'Categories', value: data?.categories },
    { label: 'Customers', value: data?.customers },
    { label: 'Shelves', value: data?.shelves },
  ];

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Operations Dashboard</Typography>
        <Chip label="Inventory Live" color="primary" variant="outlined" />
      </Stack>
      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid key={c.label} item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                <Typography variant="h3">{c.value ?? '-'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
