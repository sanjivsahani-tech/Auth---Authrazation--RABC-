import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

function toForm(fields, source = null) {
  return Object.fromEntries(
    fields.map((f) => {
      const raw = source ? source[f.name] : f.defaultValue;
      return [f.name, raw ?? (f.type === 'number' ? 0 : '')];
    }),
  );
}

function mapApiError(err, fallback) {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  if (status === 403) return 'You do not have permission for this action.';
  if (status === 401) return 'Session expired. Please login again.';
  if (status === 409 || code === 'CONFLICT') return 'Conflict: duplicate value already exists.';
  return err?.response?.data?.message || fallback;
}

export default function EntityCrudPage({ title, endpoint, fields }) {
  const moduleName = endpoint;
  const qc = useQueryClient();
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions || []), [user?.permissions]);

  const canView = permissions.has(`${moduleName}:view`);
  const canCreate = permissions.has(`${moduleName}:create`);
  const canUpdate = permissions.has(`${moduleName}:update`);
  const canDelete = permissions.has(`${moduleName}:delete`);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(fields[0]?.name || 'createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [form, setForm] = useState(() => toForm(fields));

  const queryKey = [endpoint, { page, rowsPerPage, search, sortBy, sortOrder }];
  const listQ = useQuery({
    queryKey,
    enabled: canView,
    queryFn: async () => {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        sortBy,
        sortOrder,
      };
      const res = await api.get(`/${endpoint}`, { params });
      return res.data.data;
    },
  });

  const createM = useMutation({
    mutationFn: (payload) => api.post(`/${endpoint}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      setOpen(false);
      setError('');
      setSuccess(`${title.slice(0, -1)} created successfully.`);
      setForm(toForm(fields));
    },
    onError: (err) => setError(mapApiError(err, `Failed to create ${title.slice(0, -1)}.`)),
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/${endpoint}/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      setOpen(false);
      setEditingId(null);
      setError('');
      setSuccess(`${title.slice(0, -1)} updated successfully.`);
      setForm(toForm(fields));
    },
    onError: (err) => setError(mapApiError(err, `Failed to update ${title.slice(0, -1)}.`)),
  });

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/${endpoint}/${id}`),
    onSuccess: () => {
      const currentItems = listQ.data?.items || [];
      if (currentItems.length === 1 && page > 0) {
        setPage((p) => p - 1);
      }
      qc.invalidateQueries({ queryKey: [endpoint] });
      setError('');
      setSuccess(`${title.slice(0, -1)} deleted successfully.`);
    },
    onError: (err) => setError(mapApiError(err, `Failed to delete ${title.slice(0, -1)}.`)),
  });

  const onSubmit = () => {
    if (editingId) {
      updateM.mutate({ id: editingId, payload: form });
      return;
    }
    createM.mutate(form);
  };

  const onOpenCreate = () => {
    setEditingId(null);
    setForm(toForm(fields));
    setError('');
    setOpen(true);
  };

  const onOpenEdit = (row) => {
    setEditingId(row._id);
    setForm(toForm(fields, row));
    setError('');
    setOpen(true);
  };

  const onDelete = (row) => {
    if (!window.confirm(`Delete ${title.slice(0, -1)} "${row[fields[0]?.name] || row._id}"?`)) return;
    deleteM.mutate(row._id);
  };

  const applySearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  if (!canView) {
    return (
      <Alert severity="error">
        You do not have permission to view {title.toLowerCase()}.
      </Alert>
    );
  }

  const items = listQ.data?.items || [];
  const total = listQ.data?.pagination?.total || 0;
  const mutationLoading = createM.isPending || updateM.isPending || deleteM.isPending;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">{title}</Typography>
        {canCreate && (
          <Button variant="contained" onClick={onOpenCreate}>
            Create {title.slice(0, -1)}
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          label={`Search ${title}`}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch();
          }}
          size="small"
          sx={{ minWidth: 240 }}
        />
        <TextField select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)} size="small" sx={{ minWidth: 150 }}>
          {fields.map((f) => (
            <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
          ))}
          <MenuItem value="createdAt">Created At</MenuItem>
        </TextField>
        <TextField select label="Order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} size="small" sx={{ minWidth: 120 }}>
          <MenuItem value="desc">Desc</MenuItem>
          <MenuItem value="asc">Asc</MenuItem>
        </TextField>
        <Button variant="outlined" onClick={applySearch}>Apply</Button>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 1.5 }}>
        <Table>
          <TableHead>
            <TableRow>
              {fields.map((f) => <TableCell key={f.name}>{f.label}</TableCell>)}
              {(canUpdate || canDelete) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {listQ.isLoading && (
              <TableRow>
                <TableCell colSpan={fields.length + (canUpdate || canDelete ? 1 : 0)}>Loading...</TableCell>
              </TableRow>
            )}
            {!listQ.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={fields.length + (canUpdate || canDelete ? 1 : 0)}>No records found.</TableCell>
              </TableRow>
            )}
            {items.map((row) => (
              <TableRow key={row._id}>
                {fields.map((f) => <TableCell key={f.name}>{String(row[f.name] ?? '')}</TableCell>)}
                {(canUpdate || canDelete) && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canUpdate && <Button size="small" onClick={() => onOpenEdit(row)}>Edit</Button>}
                      {canDelete && <Button size="small" color="error" onClick={() => onDelete(row)}>Delete</Button>}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{editingId ? 'Edit' : 'Create'} {title.slice(0, -1)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {fields.map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                type={f.type || 'text'}
                value={form[f.name]}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSubmit} disabled={mutationLoading}>
            {mutationLoading ? 'Please wait...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
