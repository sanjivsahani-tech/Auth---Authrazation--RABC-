import { useQuery } from '@tanstack/react-query';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../api/client';

export default function AuditLogsPage() {
  const { data } = useQuery({
    queryKey: ['audit-logs'],
    // Why: Admin audit view is read-mostly; a simple list query keeps traceability visible.
    queryFn: async () => (await api.get('/audit-logs?limit=100')).data.data.items,
  });

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Audit Logs</Typography>
      <Paper sx={{ p: 1.5 }}>
        <Table>
          <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Actor</TableCell><TableCell>Module</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
          <TableBody>
            {(data || []).map((log) => (
              <TableRow key={log._id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.actorUserId?.email || '-'}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.action}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
