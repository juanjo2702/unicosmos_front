import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import GameLobby from './pages/GameLobby'
import PlayerBuzzer from './components/PlayerBuzzer'
import PresenterDashboard from './pages/PresenterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import GameDisplay from './pages/GameDisplay'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'

// Componente de carga simple
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 mb-4 animate-pulse">
        <span className="text-2xl">🎮</span>
      </div>
      <p className="text-gray-300">Cargando Trivia UNITEPC...</p>
    </div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes with authentication */}
          <Route path="/" element={
            <PrivateRoute fallback={<LoadingFallback />}>
              <Layout><GameLobby /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/play" element={
            <PrivateRoute fallback={<LoadingFallback />}>
              <Layout><PlayerBuzzer /></Layout>
            </PrivateRoute>
          } />

          <Route path="/display/:gameId" element={
            <PrivateRoute fallback={<LoadingFallback />}>
              <GameDisplay />
            </PrivateRoute>
          } />
          
          {/* Presenter route - requires 'presenter' role */}
          <Route path="/presenter" element={
            <PrivateRoute requiredRole={['presenter', 'admin']} fallback={<LoadingFallback />}>
              <Layout><PresenterDashboard /></Layout>
            </PrivateRoute>
          } />
          
          {/* Admin route - requires 'admin' role */}
          <Route path="/admin" element={
            <PrivateRoute requiredRole="admin" fallback={<LoadingFallback />}>
              <Layout><AdminDashboard /></Layout>
            </PrivateRoute>
          } />
          
          {/* Catch-all 404 route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  )
}

export default App
