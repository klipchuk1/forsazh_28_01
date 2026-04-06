import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/admin/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CrewsPage from './pages/admin/CrewsPage';
import KpiPage from './pages/admin/KpiPage';
import ExcelImportPage from './pages/admin/ExcelImportPage';
import SegmentsPage from './pages/admin/SegmentsPage';

export default function App() {
  return (
    <Routes>
      {/* Public dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Admin login */}
      <Route path="/control-panel/login" element={<LoginPage />} />

      {/* Protected admin routes */}
      <Route path="/control-panel" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="crews" element={<CrewsPage />} />
        <Route path="kpi" element={<KpiPage />} />
        <Route path="import" element={<ExcelImportPage />} />
        <Route path="segments" element={<SegmentsPage />} />
      </Route>
    </Routes>
  );
}
