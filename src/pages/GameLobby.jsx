import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../stores/gameStore'
import toast from 'react-hot-toast'

const GameLobby = () => {
  const navigate = useNavigate()
  const { 
    gameId, 
    teams, 
    games,
    loading,
    error,
    fetchGames, 
    createGame, 
    joinGame,
    setGameId
  } = useGameStore()
  const [joinCode, setJoinCode] = useState('')
  
  useEffect(() => {
    const loadGames = async () => {
      try {
        await fetchGames()
      } catch (err) {
        toast.error('Error al cargar los juegos')
        console.error('Error fetching games:', err)
      }
    }
    loadGames()
  }, [fetchGames])
  
  const handleCreateGame = async () => {
    try {
      const gameData = {
        name: `Trivia ${new Date().toLocaleDateString()}`,
        max_teams: 4,
        category: 'General'
      }
      const game = await createGame(gameData)
      toast.success(`Juego "${game.name}" creado exitosamente`)
      setGameId(game.id)
      navigate('/play')
    } catch (err) {
      toast.error(err.data?.error || 'Error al crear el juego')
      console.error('Error creating game:', err)
    }
  }
  
  const handleJoinGame = async () => {
    if (!joinCode.trim()) return
    
    try {
      const teamData = {
        teamName: `Equipo ${Math.random().toString(36).substr(2, 5)}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }
      const result = await joinGame(joinCode.trim(), teamData)
      toast.success(`Te has unido al juego "${result.game?.name || joinCode}"`)
      navigate('/play')
    } catch (err) {
      toast.error(err.data?.error || 'Error al unirse al juego')
      console.error('Error joining game:', err)
    }
  }
  
  const handleQuickStart = () => {
    navigate('/play')
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-transparent"
        >
          Trivia UNITEPC
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-300 mb-2"
        >
          Sistema Interactivo de Concurso de Trivia
        </motion.p>
        <p className="text-gray-400">Sistema de buzzer de latencia ultra-baja para desafíos de conocimiento competitivo</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Create Game Card */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-morphism p-8 rounded-2xl hover:bg-white/5 transition-all"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Crear Nuevo Juego</h2>
            <p className="text-gray-400">Inicia una nueva sesión de trivia con configuraciones personalizadas</p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-800/50">
               <h3 className="font-medium mb-2">Configuración del Juego</h3>
               <ul className="space-y-2 text-sm text-gray-300">
                 <li className="flex items-center gap-2">
                   <span className="text-green-500">✓</span>
                   <span>Máximo 4 equipos</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="text-green-500">✓</span>
                   <span>Sistema de buzzer en tiempo real</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="text-green-500">✓</span>
                   <span>Seguimiento automático de puntajes</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="text-green-500">✓</span>
                   <span>Múltiples categorías</span>
                 </li>
               </ul>
            </div>
            
            <button
              onClick={handleCreateGame}
              className="w-full btn-primary py-4 text-lg"
            >
               Crear Sesión de Juego
            </button>
          </div>
        </motion.div>
        
        {/* Join Game Card */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism p-8 rounded-2xl hover:bg-white/5 transition-all"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
             <h2 className="text-2xl font-bold mb-2">Unirse a Juego Existente</h2>
            <p className="text-gray-400">Ingresa un código de juego para unirte a una sesión activa</p>
          </div>
          
          <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-2">Código del Juego</label>
               <input
                 type="text"
                 value={joinCode}
                 onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                 placeholder="Ingresa código del juego (ej: ABC123)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary-500"
              />
            </div>
            
            <div className="p-4 rounded-xl bg-gray-800/50">
               <h3 className="font-medium mb-2">Opciones de Unión Rápida</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setJoinCode('TRIVIA2024')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  TRIVIA2024
                </button>
                <button
                  onClick={() => setJoinCode('UNITE2024')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  UNITE2024
                </button>
                <button
                  onClick={() => setJoinCode('QUIZMASTER')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  QUIZMASTER
                </button>
              </div>
            </div>
            
            <button
              onClick={handleJoinGame}
              disabled={!joinCode.trim()}
              className="w-full btn-secondary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
               Unirse al Juego
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <div className="glass-morphism p-8 rounded-2xl mb-12">
         <h2 className="text-2xl font-bold mb-6 text-center">Acciones Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <button
             onClick={handleQuickStart}
             className="p-6 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all text-left"
           >
             <div className="text-3xl mb-3">🚀</div>
             <h3 className="text-xl font-bold mb-2">Inicio Rápido</h3>
             <p className="text-gray-300">Entra a un juego con configuraciones predeterminadas</p>
           </button>
          
           <button
             onClick={() => navigate('/presenter')}
             className="p-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all text-left"
           >
             <div className="text-3xl mb-3">🎤</div>
             <h3 className="text-xl font-bold mb-2">Modo Presentador</h3>
             <p className="text-gray-300">Controla el flujo del juego y los puntajes</p>
           </button>
          
           <button
             onClick={() => navigate('/admin')}
             className="p-6 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 transition-all text-left"
           >
             <div className="text-3xl mb-3">⚙️</div>
             <h3 className="text-xl font-bold mb-2">Panel de Administración</h3>
             <p className="text-gray-300">Gestiona preguntas y configuraciones del sistema</p>
           </button>
        </div>
      </div>
      
      {/* Game Preview */}
      <div className="glass-morphism p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">Juegos Disponibles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">No hay juegos activos. ¡Crea el primero!</p>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="p-6 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center">
                    <span className="text-2xl">🎮</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{game.name || `Juego ${game.id}`}</h3>
                    <p className="text-gray-400 text-sm">Código: {game.code || game.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Equipos</span>
                    <span className="text-2xl font-bold">{game.teams_count || game.teams?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Estado</span>
                    <span className={`font-semibold ${game.status === 'active' ? 'text-green-500' : game.status === 'finished' ? 'text-gray-500' : 'text-yellow-500'}`}>
                      {game.status === 'active' ? '● Activo' : game.status === 'finished' ? '● Finalizado' : '● Esperando'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Creado por</span>
                    <span className="text-sm">{game.creator?.name || 'Admin'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setJoinCode(game.code || game.id)
                    handleJoinGame()
                  }}
                  className="w-full mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  Unirse
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h3 className="font-semibold mb-2">Sesión de Juego Actual</h3>
               <p className="text-gray-400">
                 ID del Juego: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{gameId}</span>
               </p>
            </div>
            
            <div className="flex gap-3">
               <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                 Copiar Enlace del Juego
               </button>
               <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg">
                 Compartir con Equipos
               </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="mt-12 text-center">
         <h3 className="text-xl font-bold mb-6">Características Principales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4">
            <div className="text-3xl mb-2">⚡</div>
             <p className="font-medium">Latencia Ultra-Baja</p>
             <p className="text-sm text-gray-400">Respuesta de buzzer en tiempo real</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎯</div>
             <p className="font-medium">Competencia Justa</p>
             <p className="text-sm text-gray-400">Sistema de tiempo preciso</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">📊</div>
             <p className="font-medium">Analíticas en Vivo</p>
             <p className="text-sm text-gray-400">Seguimiento de puntajes en tiempo real</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🔧</div>
             <p className="font-medium">Configuraciones Flexibles</p>
             <p className="text-sm text-gray-400">Reglas de juego personalizables</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameLobby