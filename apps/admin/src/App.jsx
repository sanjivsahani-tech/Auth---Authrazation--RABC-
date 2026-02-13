import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import AuditLogsPage from './pages/AuditLogsPage';

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
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<ShellRoute><DashboardPage /></ShellRoute>} />
      <Route path="/users" element={<ShellRoute><UsersPage /></ShellRoute>} />
      <Route path="/roles" element={<ShellRoute><RolesPage /></ShellRoute>} />
      <Route path="/audit-logs" element={<ShellRoute><AuditLogsPage /></ShellRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
