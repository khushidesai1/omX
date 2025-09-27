import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import WorkspaceSelector from './pages/WorkspaceSelector'
import Dashboard from './pages/Dashboard'
import ProjectDetailLayout from './pages/project-detail/ProjectDetailLayout'
import ProjectDataView from './pages/project-detail/ProjectDataView'
import ProjectDashboardsView from './pages/project-detail/ProjectDashboardsView'
import WorkspaceSettings from './pages/WorkspaceSettings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/sign-in" element={<SignIn />} />
        <Route path="/auth/sign-up" element={<SignUp />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/workspaces"
          element={
            <ProtectedRoute>
              <WorkspaceSelector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:workspaceId/settings"
          element={
            <ProtectedRoute>
              <WorkspaceSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:workspaceId/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetailLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="data" replace />} />
          <Route path="data" element={<ProjectDataView />} />
          <Route path="dashboards" element={<ProjectDashboardsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
