import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../stores/authStore'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()
  
  const isActive = (path) => location.pathname === path
  
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass-morphism sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                  Trivia UNITEPC
                </h1>
                <p className="text-sm text-gray-300">Interactive Quiz Show</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/">
                <button className={`px-4 py-2 rounded-lg transition-all ${isActive('/') ? 'bg-primary-600' : 'hover:bg-white/10'}`}>
                  Game Lobby
                </button>
              </Link>
              <Link to="/play">
                <button className={`px-4 py-2 rounded-lg transition-all ${isActive('/play') ? 'bg-primary-600' : 'hover:bg-white/10'}`}>
                  Player Buzzer
                </button>
              </Link>
              <Link to="/presenter">
                <button className={`px-4 py-2 rounded-lg transition-all ${isActive('/presenter') ? 'bg-primary-600' : 'hover:bg-white/10'}`}>
                  Presenter
                </button>
              </Link>
              <Link to="/admin">
                <button className={`px-4 py-2 rounded-lg transition-all ${isActive('/admin') ? 'bg-primary-600' : 'hover:bg-white/10'}`}>
                  Admin
                </button>
              </Link>
              
              {/* Autenticación */}
              <div className="flex items-center gap-2 ml-2">
                {isAuthenticated() ? (
                  <>
                    <div className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700">
                      <span className="text-sm text-gray-300">{user?.name}</span>
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-900 text-primary-300">
                        {user?.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg hover:bg-red-600/20 text-red-300 hover:text-red-200 transition-all"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <button className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                        Iniciar sesión
                      </button>
                    </Link>
                    <Link to="/register">
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 transition-all">
                        Registrarse
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="glass-morphism mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-semibold">Trivia UNITEPC</h3>
              <p className="text-sm text-gray-300">Gamified knowledge system for university programs</p>
            </div>
            <div className="text-sm text-gray-400">
              <p>© {new Date().getFullYear()} - Ultra-low latency buzzer system</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout