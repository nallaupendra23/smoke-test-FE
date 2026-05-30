import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import KitchenDashboard from './pages/KitchenDashboard'
import MenuManager from './pages/MenuManager'
import DocumentUpload from './pages/DocumentUpload'
import Settings from './pages/Settings'
import OrderHistory from './pages/OrderHistory'
import Analytics from './pages/Analytics'
import Subscription from './pages/Subscription'
import Inventory from './pages/Inventory'
import AgentSettings from './pages/AgentSettings'
import POSOrder from './pages/POSOrder'
import Locations from './pages/Locations'
import ManagerDashboard from './pages/ManagerDashboard'

function ProtectedRoute({ children }) {
  const { owner } = useAuth()
  return owner ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { owner } = useAuth()
  return owner ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><KitchenDashboard /></ProtectedRoute>} />
      <Route path="/menu" element={<ProtectedRoute><MenuManager /></ProtectedRoute>} />
      <Route path="/agent" element={<ProtectedRoute><AgentSettings /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute><POSOrder /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppRoutes />
      </LocationProvider>
    </AuthProvider>
  )
}
