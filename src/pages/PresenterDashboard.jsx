import { useState, useEffect } from 'react'
import useReverb from '../hooks/useReverb'
import useGameStore from '../stores/gameStore'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

const PresenterDashboard = () => {
  const { 
    gameId, 
    teams, 
    currentGame,
    teamsLoading,
    teamsError,
    resetGame, 
    getLeaderboard, 
    fetchGames, 
    createGame, 
    startGame,
    games, 
    loading,
    loadGameTeams,
    setGameId,
    updateTeamScore
  } = useGameStore()
  const { buzzerState, resetBuzzer, lockBuzzer, getGameStatus } = useReverb(gameId)
  const { user } = useAuthStore()
  const [gameStatus, setGameStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('games') // 'games', 'create', 'control'
  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    max_players_per_team: 4,
    max_teams: 10,
    rounds_count: 3,
    time_per_question: 30
  })
  
  // Cargar juegos al montar
  useEffect(() => {
    loadGames()
  }, [])
  
  const loadGames = async () => {
    try {
      await fetchGames()
    } catch (error) {
      toast.error('Error al cargar juegos')
    }
  }

  const handleManageGame = async (game) => {
    try {
      setGameId(game.id.toString())
      await loadGameTeams(game.id)
      setActiveTab('control')
      toast.success(`Juego "${game.name}" cargado`)
    } catch (error) {
      toast.error('Error al cargar equipos del juego')
    }
  }

  const handleStartGame = async (game) => {
    try {
      await startGame(game.id)
      toast.success(`Juego "${game.name}" iniciado`)
      // Recargar equipos después de iniciar
      await loadGameTeams(game.id)
    } catch (error) {
      toast.error(error.message || 'Error al iniciar juego')
    }
  }

  const handleResetBuzzer = async () => {
    await resetBuzzer()
  }
  
  const handleLockBuzzer = async (locked) => {
    await lockBuzzer(locked)
  }
  
  const handleUpdateScore = async (teamId, delta) => {
    try {
      const result = await updateTeamScore(teamId, delta)
      if (result.success) {
        toast.success(`Puntaje actualizado: ${delta > 0 ? '+' : ''}${delta}`)
      } else {
        toast.error(result.error || 'Error al actualizar puntaje')
      }
    } catch (error) {
      toast.error(error.message || 'Error al actualizar puntaje')
    }
  }
  
  const handleRefreshStatus = async () => {
    const status = await getGameStatus()
    setGameStatus(status)
  }
  
  const handleCreateGame = async (e) => {
    e.preventDefault()
    try {
      await createGame(newGame)
      toast.success('Juego creado exitosamente')
      setNewGame({
        title: '',
        description: '',
        max_players_per_team: 4,
        max_teams: 10,
        rounds_count: 3,
        time_per_question: 30
      })
      setActiveTab('games')
      loadGames()
    } catch (error) {
      toast.error(error.message || 'Error al crear juego')
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setNewGame(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }
  
  const leaderboard = getLeaderboard()
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel del Presentador</h1>
          <p className="text-gray-400">Bienvenido, {user?.name}. Controla el flujo del juego y gestiona los equipos</p>
        </div>
        <div className="text-sm text-gray-400">
          ID del Juego: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{gameId}</span>
        </div>
      </div>
      
      {/* Tabs de navegación */}
      <div className="flex border-b border-gray-700 mb-8">
        <button
          className={`px-6 py-3 font-medium ${activeTab === 'games' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('games')}
        >
          Mis Juegos
        </button>
        <button
          className={`px-6 py-3 font-medium ${activeTab === 'create' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('create')}
        >
          Crear Nuevo Juego
        </button>
        <button
          className={`px-6 py-3 font-medium ${activeTab === 'control' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('control')}
        >
          Control del Juego
        </button>
      </div>
      
      {/* Contenido de pestañas */}
      {activeTab === 'games' && (
        <div className="glass-morphism p-6 rounded-2xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Mis Juegos</h2>
            <button
              onClick={loadGames}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
          
          {games.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No has creado ningún juego aún.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-primary"
              >
                Crear tu primer juego
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div key={game.id} className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-primary-500 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{game.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${game.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : game.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                          {game.status}
                        </span>
                        <span className="text-sm text-gray-400">Código: {game.code}</span>
                      </div>
                    </div>
                  </div>
                  
                  {game.settings && typeof game.settings === 'object' && (
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-300">{game.settings.description || 'Sin descripción'}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Equipos:</span>
                          <span>{game.settings.max_teams || 10} máx</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Jugadores/equipo:</span>
                          <span>{game.settings.max_players_per_team || 4}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Rondas:</span>
                          <span>{game.settings.rounds_count || 3}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Tiempo/pregunta:</span>
                          <span>{game.time_per_question || 30}s</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleManageGame(game)}
                       className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg"
                     >
                       Administrar
                     </button>
                     <button 
                       onClick={() => handleStartGame(game)}
                       className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                     >
                       Iniciar
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'create' && (
        <div className="glass-morphism p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6">Crear Nuevo Juego</h2>
          
          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre del Juego *
              </label>
              <input
                type="text"
                name="title"
                value={newGame.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: Trivia de Ciencias"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={newGame.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe el tema, categorías, reglas especiales..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jugadores por equipo
                </label>
                <input
                  type="number"
                  name="max_players_per_team"
                  value={newGame.max_players_per_team}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Máximo de equipos
                </label>
                <input
                  type="number"
                  name="max_teams"
                  value={newGame.max_teams}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="2"
                  max="20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de rondas
                </label>
                <input
                  type="number"
                  name="rounds_count"
                  value={newGame.rounds_count}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tiempo por pregunta (segundos)
                </label>
                <input
                  type="number"
                  name="time_per_question"
                  value={newGame.time_per_question}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="5"
                  max="120"
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="btn-primary px-8 py-3"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Juego'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('games')}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'control' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Buzzer Control Panel */}
            <div className="lg:col-span-2 glass-morphism p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Controles del Buzzer</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-800/50">
                  <h3 className="font-medium mb-2">Estado Actual</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${buzzerState.pressed ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-lg">
                      {buzzerState.pressed ? 'BUZZER PRESIONADO' : 'Listo'}
                    </span>
                  </div>
                  {buzzerState.pressed && (
                    <p className="mt-2 text-sm">
                      Presionado por: <span className="font-semibold">Equipo {buzzerState.teamId}</span>
                    </p>
                  )}
                </div>
                
                <div className="p-4 rounded-xl bg-gray-800/50">
                  <h3 className="font-medium mb-2">Acciones Rápidas</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleResetBuzzer}
                      disabled={!buzzerState.pressed}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reiniciar Buzzer
                    </button>
                    <button
                      onClick={() => handleLockBuzzer(!buzzerState.locked)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                    >
                      {buzzerState.locked ? 'Desbloquear' : 'Bloquear'} Buzzer
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Historial del Buzzer</h3>
                  <div className="p-4 rounded-xl bg-gray-900/50">
                    <p className="text-gray-400 text-sm">
                      Última pulsación: {buzzerState.timestamp ? new Date(buzzerState.timestamp).toLocaleTimeString() : 'Ninguna'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Info */}
            <div className="glass-morphism p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Información del Juego</h2>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={handleRefreshStatus}
                    className="w-full btn-primary mb-4"
                  >
                    Actualizar Estado
                  </button>
                  
                  {gameStatus && (
                    <div className="p-4 rounded-xl bg-gray-900/50 space-y-2">
                      <p><span className="text-gray-400">Equipos activos:</span> {teams.length}</p>
                      <p><span className="text-gray-400">Estado del buzzer:</span> {buzzerState.pressed ? 'Presionado' : 'Listo'}</p>
                      <p><span className="text-gray-400">Juego activo:</span> Sí</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Acciones del Juego</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => useGameStore.getState().createNewGame()}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                    >
                      Nuevo Juego Local
                    </button>
                    <button
                      onClick={resetGame}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Reiniciar Puntajes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="glass-morphism p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Posición</th>
                    <th className="text-left py-3 px-4">Equipo</th>
                    <th className="text-left py-3 px-4">Puntaje</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, index) => (
                    <tr key={team.id} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full ${index < 3 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-800'}`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-2xl font-bold">{team.score}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateScore(team.id, 10)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleUpdateScore(team.id, 5)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleUpdateScore(team.id, -5)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                          >
                            -5
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Teams Management */}
          <div className="glass-morphism p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Gestión de Equipos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="p-4 rounded-xl bg-gray-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <h3 className="font-semibold">{team.name}</h3>
                      <p className="text-sm text-gray-400">ID: {team.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Puntaje:</span>
                      <span className="text-xl font-bold">{team.score}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateScore(team.id, 1)}
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleUpdateScore(team.id, -1)}
                        className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        -1
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PresenterDashboard