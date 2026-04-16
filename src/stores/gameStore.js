import { create } from 'zustand'
import apiClient from '../api/client'
import useAuthStore from './authStore'

const unwrap = (payload) => {
  if (payload?.success && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }

  return payload
}

const extractCollection = (payload) => {
  const data = unwrap(payload)

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

const useGameStore = create((set, get) => ({
  gameId: null,
  currentGame: null,
  joinedTeam: null,
  teams: [],
  games: [],
  loading: false,
  error: null,
  teamsLoading: false,
  teamsError: null,

  setGameId: (gameId) => set({ gameId }),

  setCurrentGameData: (game) => {
    if (!game) {
      return
    }

    set({
      currentGame: game,
      gameId: game.id ?? get().gameId,
      teams: Array.isArray(game.teams) ? game.teams : get().teams,
    })
  },

  setJoinedTeam: (team) => set({ joinedTeam: team }),

  fetchGames: async () => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.get('/api/games')
      const games = extractCollection(response)
      set({ games, loading: false })
      return games
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  createGame: async (gameData) => {
    set({ loading: true, error: null })

    try {
      const payload = {
        title: gameData.title,
        description: gameData.description ?? '',
        max_players_per_team: gameData.max_players_per_team ?? 4,
        max_teams: gameData.max_teams ?? 4,
        rounds_count: gameData.rounds_count ?? 3,
        time_per_question: gameData.time_per_question ?? 30,
        response_time_limit: gameData.response_time_limit ?? 15,
        category_ids: gameData.category_ids ?? [],
      }

      const response = await apiClient.post('/api/games', payload)
      const game = unwrap(response)

      set((state) => ({
        loading: false,
        currentGame: game,
        gameId: game.id,
        teams: Array.isArray(game.teams) ? game.teams : [],
        games: [game, ...state.games.filter((item) => item.id !== game.id)],
      }))

      return game
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  joinGame: async (gameIdentifier, teamData) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post(`/api/games/${gameIdentifier}/join`, {
        team_name: teamData.team_name,
        team_color: teamData.team_color,
      })

      const result = unwrap(response)

      set({
        loading: false,
        currentGame: result.game ?? null,
        gameId: result.game?.id ?? get().gameId,
        teams: Array.isArray(result.game?.teams) ? result.game.teams : [],
        joinedTeam: result.team ?? null,
      })

      const currentUser = useAuthStore.getState().user
      if (currentUser && result.team) {
        useAuthStore.getState().setUser({
          ...currentUser,
          team_id: result.team.id,
          team: result.team,
        })
      }

      return result
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  startGame: async (gameIdentifier) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post(`/api/games/${gameIdentifier}/start`)
      const game = unwrap(response)

      set((state) => ({
        loading: false,
        currentGame: game,
        gameId: game.id,
        games: state.games.map((item) => (item.id === game.id ? { ...item, ...game } : item)),
      }))

      return game
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  loadGameTeams: async (gameIdentifier) => {
    set({ teamsLoading: true, teamsError: null })

    try {
      const response = await apiClient.get(`/api/games/${gameIdentifier}`)
      const game = unwrap(response)
      const teams = Array.isArray(game?.teams) ? game.teams : []

      set({
        teamsLoading: false,
        currentGame: game,
        gameId: game.id ?? get().gameId,
        teams,
        joinedTeam: teams.find((team) => String(team.id) === String(useAuthStore.getState().user?.team_id)) ?? get().joinedTeam,
      })

      return teams
    } catch (error) {
      set({ teamsLoading: false, teamsError: error.message })
      throw error
    }
  },

  fetchLobby: async (gameIdentifier) => {
    try {
      const response = await apiClient.get(`/api/games/${gameIdentifier}/lobby`)
      const lobby = unwrap(response)

      if (lobby?.game) {
        set({
          currentGame: lobby.game,
          gameId: lobby.game.id ?? get().gameId,
          teams: Array.isArray(lobby.game.teams) ? lobby.game.teams : [],
        })
      }

      return lobby
    } catch (error) {
      throw error
    }
  },

  nextQuestion: async (gameIdentifier) => {
    set({ loading: true, error: null })

    try {
      const response = await apiClient.post(`/api/games/${gameIdentifier}/next-question`)
      const game = unwrap(response)

      set((state) => ({
        loading: false,
        currentGame: game,
        gameId: game.id ?? state.gameId,
        teams: Array.isArray(game.teams) ? game.teams : state.teams,
        games: state.games.map((item) => (item.id === game.id ? { ...item, ...game } : item)),
      }))

      return game
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  updateTeamScore: async (teamId, delta) => {
    try {
      const response = await apiClient.patch(`/api/teams/${teamId}/score`, { delta })
      const updatedTeam = unwrap(response)

      set((state) => ({
        teams: state.teams.map((team) => (
          String(team.id) === String(teamId) ? { ...team, ...updatedTeam } : team
        )),
        currentGame: state.currentGame ? {
          ...state.currentGame,
          teams: Array.isArray(state.currentGame.teams)
            ? state.currentGame.teams.map((team) => (
              String(team.id) === String(teamId) ? { ...team, ...updatedTeam } : team
            ))
            : state.currentGame.teams,
        } : null,
      }))

      return { success: true, data: updatedTeam }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  getTeamById: (teamId) => get().teams.find((team) => String(team.id) === String(teamId)),

  getLeaderboard: () => [...get().teams].sort((a, b) => b.score - a.score),

  clearGameSession: () => set({
    gameId: null,
    currentGame: null,
    joinedTeam: null,
    teams: [],
    error: null,
    teamsError: null,
  }),
}))

export default useGameStore
