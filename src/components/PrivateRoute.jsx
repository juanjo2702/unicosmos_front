import { Navigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { Toaster } from 'react-hot-toast'

/**
 * Componente para proteger rutas que requieren autenticación
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si autenticado
 * @param {boolean} props.requireAuth - Si requiere autenticación (default: true)
 * @param {string|Array<string>} props.requiredRole - Rol o roles requeridos (opcional)
 * @param {string} props.redirectTo - Ruta para redirigir si no autenticado (default: '/login')
 * @param {React.ReactNode} props.fallback - Componente alternativo mientras verifica (opcional)
 */
const PrivateRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRole = null,
  redirectTo = '/login',
  fallback = null 
}) => {
  const { isAuthenticated, getUserRole, isLoading } = useAuthStore()
  
  // Si está cargando, mostrar fallback o nada
  if (isLoading && fallback) {
    return <>{fallback}</>
  }
  
  // Si no requiere autenticación, renderizar directamente
  if (!requireAuth) {
    return <>{children}</>
  }
  
  // Verificar autenticación
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />
  }
  
  // Verificar rol si se especifica
  if (requiredRole) {
    const userRole = getUserRole()
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (!roles.includes(userRole)) {
      // Usuario no tiene el rol requerido
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
          <div className="glass-morphism rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-4">Acceso Restringido</h1>
            <p className="text-gray-300 mb-6">
              No tienes permiso para acceder a esta página.
              Se requiere uno de los siguientes roles: {roles.join(', ')}
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary w-full"
            >
              Volver atrás
            </button>
          </div>
          <Toaster />
        </div>
      )
    }
  }
  
  // Usuario autenticado (y con rol si se requiere)
  return <>{children}</>
}

export default PrivateRoute