import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EntityCrudPage from './pages/EntityCrudPage';
import ProductsPage from './pages/ProductsPage';

function ShellRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ShellRoute><DashboardPage /></ShellRoute>} />
      <Route path="/categories" element={<ShellRoute><EntityCrudPage title="Categories" endpoint="categories" fields={[{ name: 'name', label: 'Name' }, { name: 'description', label: 'Description' }]} /></ShellRoute>} />
      <Route path="/shelves" element={<ShellRoute><EntityCrudPage title="Shelves" endpoint="shelves" fields={[{ name: 'code', label: 'Code' }, { name: 'name', label: 'Name' }, { name: 'locationNote', label: 'Location Note' }]} /></ShellRoute>} />
      <Route path="/customers" element={<ShellRoute><EntityCrudPage title="Customers" endpoint="customers" fields={[{ name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email' }, { name: 'address', label: 'Address' }]} /></ShellRoute>} />
      <Route path="/products" element={<ShellRoute><ProductsPage /></ShellRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}