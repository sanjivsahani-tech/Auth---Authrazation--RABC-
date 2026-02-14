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

function mapApiError(err, fallback) {
  // Why: Product module shows user-friendly messages for common auth/conflict failures.
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  if (status === 403) return 'You do not have permission for this action.';
  if (status === 401) return 'Session expired. Please login again.';
  if (status === 409 || code === 'CONFLICT') return 'Conflict: duplicate value already exists.';
  return err?.response?.data?.message || fallback;
}

const defaultForm = {
  sku: '',
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  shelfId: '',
};

export default function ProductsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions || []), [user?.permissions]);

  // Why: Product actions can be granted independently, so each button checks its own permission.
  const canView = permissions.has('products:view');
  const canCreate = permissions.has('products:create');
  const canUpdate = permissions.has('products:update');
  const canDelete = permissions.has('products:delete');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [form, setForm] = useState(defaultForm);

  const queryKey = ['products', { page, rowsPerPage, search, sortBy, sortOrder }];
  const productsQ = useQuery({
    queryKey,
    enabled: canView,
    queryFn: async () => {
      // Behavior: Convert UI table state into backend-compatible query params.
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        sortBy,
        sortOrder,
      };
      const res = await api.get('/products', { params });
      return res.data.data;
    },
  });

  const categoriesQ = useQuery({
    queryKey: ['categories', 'all-options'],
    queryFn: async () => (await api.get('/categories?limit=100')).data.data.items,
  });

  const shelvesQ = useQuery({
    queryKey: ['shelves', 'all-options'],
    queryFn: async () => (await api.get('/shelves?limit=100')).data.data.items,
  });

  const createM = useMutation({
    mutationFn: (payload) => api.post('/products', payload),
    onSuccess: () => {
      // Why: Product list and counts should immediately reflect write operations.
      qc.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setError('');
      setSuccess('Product created successfully.');
      setForm(defaultForm);
    },
    onError: (err) => setError(mapApiError(err, 'Failed to create product.')),
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/products/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setEditingId(null);
      setError('');
      setSuccess('Product updated successfully.');
      setForm(defaultForm);
    },
    onError: (err) => setError(mapApiError(err, 'Failed to update product.')),
  });

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      const currentItems = productsQ.data?.items || [];
      if (currentItems.length === 1 && page > 0) {
        setPage((p) => p - 1);
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      setError('');
      setSuccess('Product deleted successfully.');
    },
    onError: (err) => setError(mapApiError(err, 'Failed to delete product.')),
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
    setForm(defaultForm);
    setError('');
    setOpen(true);
  };

  const onOpenEdit = (p) => {
    // Why: API may return populated refs; form needs raw IDs for select inputs.
    setEditingId(p._id);
    setForm({
      sku: p.sku || '',
      name: p.name || '',
      categoryId: p.categoryId?._id || p.categoryId || '',
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      shelfId: p.shelfId?._id || p.shelfId || '',
    });
    setError('');
    setOpen(true);
  };

  const onDelete = (p) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    deleteM.mutate(p._id);
  };

  const applySearch = () => {
    // Why: Reset page while applying filters to keep pagination consistent.
    setPage(0);
    setSearch(searchInput.trim());
  };

  if (!canView) {
    return <Alert severity="error">You do not have permission to view products.</Alert>;
  }

  const products = productsQ.data?.items || [];
  const total = productsQ.data?.pagination?.total || 0;
  const mutationLoading = createM.isPending || updateM.isPending || deleteM.isPending;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Products</Typography>
        {canCreate && (
          <Button variant="contained" onClick={onOpenCreate}>
            Create Product
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="Search products"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch();
          }}
          size="small"
          sx={{ minWidth: 240 }}
        />
        <TextField select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)} size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="createdAt">Created At</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="sku">SKU</MenuItem>
          <MenuItem value="price">Price</MenuItem>
          <MenuItem value="stock">Stock</MenuItem>
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
              <TableCell>SKU</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Shelf</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              {(canUpdate || canDelete) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {productsQ.isLoading && (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>Loading...</TableCell>
              </TableRow>
            )}
            {!productsQ.isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>No records found.</TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.categoryId?.name || '-'}</TableCell>
                <TableCell>{p.shelfId?.name || '-'}</TableCell>
                <TableCell>{p.price}</TableCell>
                <TableCell>{p.stock}</TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canUpdate && <Button size="small" onClick={() => onOpenEdit(p)}>Edit</Button>}
                      {canDelete && <Button size="small" color="error" onClick={() => onDelete(p)}>Delete</Button>}
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
        <DialogTitle>{editingId ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="SKU" value={form.sku} onChange={(e) => setForm((v) => ({ ...v, sku: e.target.value }))} />
            <TextField label="Name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            <TextField select label="Category" value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))}>
              {(categoriesQ.data || []).map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Shelf" value={form.shelfId} onChange={(e) => setForm((v) => ({ ...v, shelfId: e.target.value }))}>
              {(shelvesQ.data || []).map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </TextField>
            <TextField type="number" label="Price" value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: Number(e.target.value) }))} />
            <TextField type="number" label="Stock" value={form.stock} onChange={(e) => setForm((v) => ({ ...v, stock: Number(e.target.value) }))} />
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
