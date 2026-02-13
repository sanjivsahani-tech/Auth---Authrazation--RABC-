import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

const SUPER_ADMIN_ROLE = 'SuperAdmin';

function mapEditRoleError(err) {
  const code = err?.response?.data?.code;
  if (code === 'ROLE_PROTECTED') return 'SuperAdmin user role cannot be changed';
  if (code === 'ROLE_ASSIGNMENT_INVALID') return 'Select exactly one role';
  if (code === 'FORBIDDEN') return 'You do not have permission to assign roles';
  return err?.response?.data?.message || 'Failed to update role';
}

export default function UsersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions || []), [user?.permissions]);
  const canCreateUser = permissions.has('users:create');
  const canAssignRoles = permissions.has('roles:assign');

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', roleIds: [] });

  const usersQ = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users?limit=100')).data.data.items });
  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles?limit=100')).data.data.items });

  const createM = useMutation({
    mutationFn: (payload) => api.post('/users', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm({ name: '', email: '', phone: '', password: '', roleIds: [] });
      setShowPassword(false);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create user'),
  });

  const updateRoleM = useMutation({
    mutationFn: ({ userId, roleId }) => api.patch(`/users/${userId}/roles`, { roleIds: [roleId] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      closeEditDialog();
    },
    onError: (err) => setEditError(mapEditRoleError(err)),
  });

  const roleNameMap = useMemo(() => {
    const m = new Map();
    (rolesQ.data || []).forEach((r) => m.set(r._id, r.name));
    return m;
  }, [rolesQ.data]);

  function userRoleIds(record) {
    return (record.roleIds || []).map((role) => role?._id || role);
  }

  function isSuperAdminUser(record) {
    return (record.roleIds || []).some((role) => role?.name === SUPER_ADMIN_ROLE || roleNameMap.get(role?._id || role) === SUPER_ADMIN_ROLE);
  }

  function openEditDialog(record) {
    setEditUser(record);
    setSelectedRoleId(userRoleIds(record)[0] || '');
    setEditError('');
    setEditOpen(true);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditUser(null);
    setSelectedRoleId('');
    setEditError('');
  }

  function submitRoleChange() {
    if (!editUser || !selectedRoleId) {
      setEditError('Please select one role');
      return;
    }
    const roleLabel = roleNameMap.get(selectedRoleId) || 'selected role';
    const ok = window.confirm(`Change role for ${editUser.email} to ${roleLabel}?`);
    if (!ok) return;
    updateRoleM.mutate({ userId: editUser._id, roleId: selectedRoleId });
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Users</Typography>
        {canCreateUser && <Button variant="contained" onClick={() => setOpen(true)}>Create User</Button>}
      </Stack>

      <Paper sx={{ p: 1.5 }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Roles</TableCell><TableCell>Status</TableCell>{canAssignRoles && <TableCell align="right">Actions</TableCell>}</TableRow></TableHead>
          <TableBody>
            {(usersQ.data || []).map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{(u.roleIds || []).map((r) => roleNameMap.get(r._id || r)).join(', ')}</TableCell>
                <TableCell>{u.isActive ? 'Active' : 'Inactive'}</TableCell>
                {canAssignRoles && (
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEditDialog(u)} disabled={isSuperAdminUser(u)}>
                      Edit Role
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
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
            <TextField select SelectProps={{ multiple: true }} label="Roles" value={form.roleIds} onChange={(e) => setForm((v) => ({ ...v, roleIds: e.target.value }))}>
              {(rolesQ.data || []).map((r) => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createM.mutate(form)}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}
            {editUser && (
              <Typography variant="body2">
                {editUser.name} ({editUser.email})
              </Typography>
            )}
            <TextField
              select
              label="Role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {(rolesQ.data || []).map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitRoleChange} disabled={updateRoleM.isPending}>
            {updateRoleM.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
