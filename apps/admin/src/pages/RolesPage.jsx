import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

const SUPER_ADMIN_ROLE = 'SuperAdmin';
const ADMIN_ACCESS_MODULES = ['users', 'roles', 'permissions', 'audit', 'dashboard'];
const BUSINESS_MODULES = ['categories', 'shelves', 'products', 'customers'];

export default function RolesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions || []), [user?.permissions]);
  const canCreate = permissions.has('roles:create');
  const canUpdate = permissions.has('roles:update');

  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState([]);

  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles?limit=100')).data.data.items });
  const permsQ = useQuery({ queryKey: ['permissions'], queryFn: async () => (await api.get('/permissions')).data.data.items });

  const createM = useMutation({
    mutationFn: (payload) => api.post('/roles', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      closeDialog();
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create role'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/roles/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      closeDialog();
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update role'),
  });

  const grouped = useMemo(() => {
    const groups = {};
    (permsQ.data || []).forEach((p) => {
      const [module] = p.split(':');
      groups[module] = groups[module] || [];
      groups[module].push(p);
    });
    return groups;
  }, [permsQ.data]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function addManyPermissions(perms) {
    setSelected((prev) => [...new Set([...prev, ...perms])]);
  }

  function removeManyPermissions(perms) {
    const removeSet = new Set(perms);
    setSelected((prev) => prev.filter((perm) => !removeSet.has(perm)));
  }

  function toggleModuleSelectAll(perms, checked) {
    if (checked) {
      addManyPermissions(perms);
      return;
    }
    removeManyPermissions(perms);
  }

  function toggleSinglePermission(perm, checked) {
    if (checked) {
      setSelected((prev) => [...new Set([...prev, perm])]);
      return;
    }
    setSelected((prev) => prev.filter((x) => x !== perm));
  }

  function renderModuleCard(module) {
    const perms = grouped[module] || [];
    if (!perms.length) return null;

    const allSelected = perms.every((perm) => selectedSet.has(perm));
    const someSelected = perms.some((perm) => selectedSet.has(perm));

    return (
      <Grid item xs={12} md={6} key={module}>
        <Box sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {module}
            </Typography>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={(e) => toggleModuleSelectAll(perms, e.target.checked)}
                />
              }
              label={`Select All (${module})`}
            />
          </Stack>
          {perms.map((perm) => (
            <FormControlLabel
              key={perm}
              control={
                <Checkbox
                  checked={selectedSet.has(perm)}
                  onChange={(e) => toggleSinglePermission(perm, e.target.checked)}
                />
              }
              label={perm}
            />
          ))}
        </Box>
      </Grid>
    );
  }

  function closeDialog() {
    setOpen(false);
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelected([]);
    setError('');
  }

  function openCreate() {
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelected([]);
    setError('');
    setOpen(true);
  }

  function openEdit(role) {
    setEditingRole(role);
    setName(role.name || '');
    setDescription(role.description || '');
    setSelected(role.permissionKeys || []);
    setError('');
    setOpen(true);
  }

  function submit() {
    const payload = { name, description, permissionKeys: selected };
    if (editingRole) {
      updateM.mutate({ id: editingRole._id, payload });
      return;
    }
    createM.mutate(payload);
  }

  const mutationPending = createM.isPending || updateM.isPending;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Roles</Typography>
        {canCreate && (
          <Button variant="contained" onClick={openCreate}>
            Create Role
          </Button>
        )}
      </Stack>

      <Paper sx={{ p: 1.5 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Permissions</TableCell>
              {canUpdate && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rolesQ.data || []).map((r) => {
              const isProtected = r.name === SUPER_ADMIN_ROLE;
              return (
                <TableRow key={r._id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>{(r.permissionKeys || []).length}</TableCell>
                  {canUpdate && (
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(r)} disabled={isProtected}>
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Role name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Typography variant="subtitle2">Permissions</Typography>
            {!permsQ.data?.length ? (
              <Alert severity="info">No permissions found</Alert>
            ) : (
              <>
                <Typography variant="subtitle2">User Roles & Permissions</Typography>
                <Grid container spacing={1}>
                  {ADMIN_ACCESS_MODULES.map((module) => renderModuleCard(module))}
                </Grid>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Business Permissions</Typography>
                <Grid container spacing={1}>
                  {BUSINESS_MODULES.map((module) => renderModuleCard(module))}
                </Grid>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={mutationPending}>
            {mutationPending ? 'Please wait...' : editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
