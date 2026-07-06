import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SubmitReport from './pages/rm/SubmitReport';
import MyReports from './pages/rm/MyReports';
import Performance from './pages/rm/Performance';
import TeamDashboard from './pages/teamlead/TeamDashboard';
import EmployeeReports from './pages/teamlead/EmployeeReports';
import TeamTargets from './pages/teamlead/TeamTargets';
import OrgDashboard from './pages/hod/OrgDashboard';
import UserManagement from './pages/hod/UserManagement';
import ZoneManagement from './pages/hod/ZoneManagement';
import AllReports from './pages/hod/AllReports';
import TargetManagement from './pages/hod/TargetManagement';
import LoadingSpinner from './components/common/LoadingSpinner';

const App = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* RM Routes */}
          <Route
            path="/submit-report"
            element={<ProtectedRoute allowedRoles={['RM']}><SubmitReport /></ProtectedRoute>}
          />
          <Route
            path="/my-reports"
            element={<ProtectedRoute allowedRoles={['RM']}><MyReports /></ProtectedRoute>}
          />
          <Route
            path="/my-performance"
            element={<ProtectedRoute allowedRoles={['RM']}><Performance /></ProtectedRoute>}
          />

          {/* Team Lead Routes */}
          <Route
            path="/team-dashboard"
            element={<ProtectedRoute allowedRoles={['TEAM_LEAD']}><TeamDashboard /></ProtectedRoute>}
          />
          <Route
            path="/employee-reports"
            element={<ProtectedRoute allowedRoles={['TEAM_LEAD']}><EmployeeReports /></ProtectedRoute>}
          />
          <Route
            path="/team-targets"
            element={<ProtectedRoute allowedRoles={['TEAM_LEAD']}><TeamTargets /></ProtectedRoute>}
          />

          {/* HOD Routes */}
          <Route
            path="/org-dashboard"
            element={<ProtectedRoute allowedRoles={['HOD']}><OrgDashboard /></ProtectedRoute>}
          />
          <Route
            path="/user-management"
            element={<ProtectedRoute allowedRoles={['HOD']}><UserManagement /></ProtectedRoute>}
          />
          <Route
            path="/zone-management"
            element={<ProtectedRoute allowedRoles={['HOD']}><ZoneManagement /></ProtectedRoute>}
          />
          <Route
            path="/all-reports"
            element={<ProtectedRoute allowedRoles={['HOD']}><AllReports /></ProtectedRoute>}
          />
          <Route
            path="/target-management"
            element={<ProtectedRoute allowedRoles={['HOD']}><TargetManagement /></ProtectedRoute>}
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
