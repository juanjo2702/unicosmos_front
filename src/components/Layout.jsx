import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../stores/authStore'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()

  const role = user?.role
  const links = [
    { to: '/', label: 'Lobby', visible: true },
    { to: '/play', label: 'Jugar', visible: true },
    { to: '/presenter', label: 'Presentador', visible: role === 'presenter' || role === 'admin' },
    { to: '/admin', label: 'Admin', visible: role === 'admin' },
  ].filter((item) => item.visible)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="glass-morphism sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Trivia UNITEPC</p>
            <h1 className="text-2xl font-bold">Concurso en vivo</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                <button
                  className={`rounded-xl px-4 py-2 transition-all ${
                    location.pathname === link.to ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated() && (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-red-200 transition-all hover:bg-red-500/20"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

export default Layout
