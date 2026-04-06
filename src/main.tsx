// Polyfill crypto.randomUUID for older browsers (used by Supabase Realtime)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
  };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

import Dashboard from './pages/Dashboard'
import LoginPage from './pages/admin/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import CrewsPage from './pages/admin/CrewsPage'
import KpiPage from './pages/admin/KpiPage'
import ExcelImportPage from './pages/admin/ExcelImportPage'
import SegmentsPage from './pages/admin/SegmentsPage'

const router = createBrowserRouter([
  { path: '/', element: <AuthProvider><Dashboard /></AuthProvider> },
  { path: '/control-panel/login', element: <AuthProvider><LoginPage /></AuthProvider> },
  {
    path: '/control-panel',
    element: <AuthProvider><ProtectedRoute><AdminLayout /></ProtectedRoute></AuthProvider>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'crews', element: <CrewsPage /> },
      { path: 'kpi', element: <KpiPage /> },
      { path: 'import', element: <ExcelImportPage /> },
      { path: 'segments', element: <SegmentsPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
