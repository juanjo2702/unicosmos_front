import { create } from 'zustand'
import apiClient from '../api/client'

const useGameStore = create((set, get) => ({
  // Game state
  gameId: 'game-' + Math.random().toString(36).substr(2, 9),
  teams: [], // Equipos reales cargados desde API
  teamsLoading: false,
  teamsError: null,
  currentTeam: null,
  buzzerPressed: false,
  buzzerLocked: false,
  lastPressTime: null,
  games: [],
  currentGame: null,
  loading: false,
  error: null,
  
  // Game actions
  setGameId: (gameId) => set({ gameId }),
  
  addTeam: (team) => set((state) => ({
    teams: [...state.teams, team]
  })),
  
  removeTeam: (teamId) => set((state) => ({
    teams: state.teams.filter(team => team.id !== teamId)
  })),
  
  updateTeamScore: async (teamId, delta) => {
    const { teams, currentGame } = get()
    const team = teams.find(t => t.id == teamId) // Use == for string/number comparison
    if (!team) {
      console.error('Team not found:', teamId)
      return { success: false, error: 'Team not found' }
    }
    
    const newScore = Math.max(0, team.score + delta)
    
    try {
      // Call API to update score
      const response = await apiClient.patch(`/api/teams/${teamId}/score`, {
        score: Math.abs(delta),
        action: delta >= 0 ? 'add' : 'set' // For negative delta, we set the score directly
      })
      
      // Update local state with API response
      const updatedTeam = response.data?.data || response.data || response
      set(state => ({
        teams: state.teams.map(t =>
          t.id == teamId ? { ...t, score: updatedTeam.score } : t
        )
      }))
      
      return { success: true, data: updatedTeam }
    } catch (error) {
      console.error('Error updating team score:', error)
      // Revert to local update if API fails? For now, just show error
      return { success: false, error: error.message }
    }
  },
  
  setBuzzerPressed: (teamId) => set({
    buzzerPressed: true,
    currentTeam: teamId,
    lastPressTime: Date.now()
  }),
  
  resetBuzzer: () => set({
    buzzerPressed: false,
    currentTeam: null
  }),
  
  setBuzzerLocked: (locked) => set({ buzzerLocked: locked }),
  
  // API actions
  fetchGames: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get('/api/games')
      // La API devuelve { success: true, data: { data: [], ... } }
      const games = response.data?.data || response.data || response
      set({ games: Array.isArray(games) ? games : [], loading: false })
      return games
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  createGame: async (gameData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post('/api/games', gameData)
      // La API devuelve { success: true, data: game, message: ... }
      const game = response.data || response
      set(state => ({ 
        games: [...state.games, game],
        currentGame: game,
        teams: [], // No teams when game is created
        loading: false 
      }))
      return game
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  joinGame: async (gameId, teamData) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post(`/api/games/${gameId}/join`, teamData)
      // La API devuelve { success: true, data: { game, team } }
      const result = response.data || response
      set({ 
        currentGame: result.game,
        teams: result.game?.teams || [],
        loading: false 
      })
      return result
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  
  startGame: async (gameId) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post(`/api/games/${gameId}/start`)
      // La API devuelve { success: true, data: game }
      const game = response.data || response
      set(state => ({ 
        currentGame: game,
        loading: false 
      }))
      return game
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  loadGameTeams: async (gameId) => {
    set({ teamsLoading: true, teamsError: null })
    try {
      const response = await apiClient.get(`/api/games/${gameId}`)
      const game = response.data?.data || response.data || response
      const teams = game.teams || []
      set({ 
        teams,
        teamsLoading: false,
        currentGame: game
      })
      return teams
    } catch (error) {
      set({ teamsError: error.message, teamsLoading: false })
      throw error
    }
  },

  // Selectors
  getTeamById: (teamId) => {
    return get().teams.find(team => team.id === teamId)
  },
  
  getLeaderboard: () => {
    const teams = [...get().teams]
    return teams.sort((a, b) => b.score - a.score)
  },
  
  getFastestPress: () => {
    // This would normally compare press times
    return get().currentTeam
  },
  
  // Game management
  createNewGame: () => {
    const gameId = 'game-' + Math.random().toString(36).substr(2, 9)
    set({
      gameId,
      teams: get().teams.map(team => ({ ...team, score: 0 })),
      buzzerPressed: false,
      currentTeam: null,
      buzzerLocked: false,
      lastPressTime: null
    })
    return gameId
  },
  
  resetGame: () => set({
    teams: get().teams.map(team => ({ ...team, score: 0 })),
    buzzerPressed: false,
    currentTeam: null,
    buzzerLocked: false,
    lastPressTime: null
  })
}))

export default useGameStore