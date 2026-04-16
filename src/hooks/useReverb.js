import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import echo from '../echo'
import useGameStore from '../stores/gameStore'

const unwrap = (payload) => {
  if (payload?.success && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }

  return payload
}

const initialBuzzerState = {
  pressed: false,
  teamId: null,
  timestamp: null,
  locked: false,
  acceptingBuzzers: false,
  unlockAt: null,
  remainingSeconds: 0,
  countdownSeconds: 0,
  responseTimeLimit: 0,
  responseStartedAt: null,
  responseEndsAt: null,
  responseRemainingSeconds: 0,
  answeringTeamId: null,
}

const getRemainingSeconds = (targetDate) => {
  if (!targetDate) {
    return 0
  }

  const remainingMs = new Date(targetDate).getTime() - Date.now()
  if (remainingMs <= 0) {
    return 0
  }

  return Math.ceil(remainingMs / 1000)
}

const useReverb = (gameId) => {
  const [isConnected, setIsConnected] = useState(false)
  const [buzzerState, setBuzzerState] = useState(initialBuzzerState)
  const [gameState, setGameState] = useState(null)

  const syncLobby = useCallback(async () => {
    if (!gameId) {
      return null
    }

    try {
      const response = await apiClient.get(`/api/games/${gameId}/lobby`)
      const lobby = unwrap(response)

      if (lobby?.game) {
        setGameState(lobby.game)
        useGameStore.getState().setCurrentGameData(lobby.game)
      }

      if (lobby?.buzzer) {
        setBuzzerState((current) => ({ ...current, ...lobby.buzzer }))
      }

      return lobby
    } catch (error) {
      console.error('Error getting game status:', error)
      return null
    }
  }, [gameId])

  useEffect(() => {
    if (!gameId) {
      setBuzzerState(initialBuzzerState)
      setGameState(null)
      return undefined
    }

    syncLobby()
    const intervalId = window.setInterval(syncLobby, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [gameId, syncLobby])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setBuzzerState((current) => {
        const nextRemainingSeconds = getRemainingSeconds(current.unlockAt)
        const nextResponseRemainingSeconds = getRemainingSeconds(current.responseEndsAt)
        const shouldAcceptBuzzers = (
          !current.locked &&
          !current.pressed &&
          !!current.unlockAt &&
          nextRemainingSeconds === 0
        ) ? true : current.acceptingBuzzers

        if (
          nextRemainingSeconds === current.remainingSeconds &&
          nextResponseRemainingSeconds === current.responseRemainingSeconds &&
          shouldAcceptBuzzers === current.acceptingBuzzers
        ) {
          return current
        }

        return {
          ...current,
          remainingSeconds: nextRemainingSeconds,
          responseRemainingSeconds: nextResponseRemainingSeconds,
          acceptingBuzzers: shouldAcceptBuzzers,
        }
      })
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!gameId) {
      setIsConnected(false)
      return undefined
    }

    let channel = null

    try {
      channel = echo.channel(`game.${gameId}`)

      channel.listen('.buzzer.pressed', (data) => {
        setBuzzerState((current) => ({
          ...current,
          pressed: true,
          teamId: data.teamId,
          timestamp: data.timestamp,
          acceptingBuzzers: false,
          responseStartedAt: data.timestamp ?? current.responseStartedAt,
          responseEndsAt: data.responseEndsAt ?? current.responseEndsAt,
          responseTimeLimit: data.responseTimeLimit ?? current.responseTimeLimit,
          responseRemainingSeconds: getRemainingSeconds(data.responseEndsAt),
          answeringTeamId: data.teamId,
        }))
      })

      channel.listen('.buzzer.reset', () => {
        setBuzzerState((current) => ({
          ...current,
          pressed: false,
          teamId: null,
          timestamp: null,
          acceptingBuzzers: !current.locked && getRemainingSeconds(current.unlockAt) === 0,
          responseStartedAt: null,
          responseEndsAt: null,
          responseRemainingSeconds: 0,
          answeringTeamId: null,
        }))
      })

      channel.listen('.buzzer.locked', ({ locked }) => {
        setBuzzerState((current) => ({ ...current, locked }))
      })

      channel.listen('.game.started', (data) => {
        setGameState(data.game)
        useGameStore.getState().setCurrentGameData(data.game)
        toast.success(`Juego ${data.game?.name ?? data.gameId} iniciado`)
      })

      channel.subscribed(() => {
        setIsConnected(true)
      })

      channel.error((error) => {
        console.error('Reverb channel error:', error)
        setIsConnected(false)
      })
    } catch (error) {
      console.warn('Realtime unavailable, fallback to polling only:', error)
      setIsConnected(false)
    }

    return () => {
      try {
        channel?.unsubscribe()
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error)
      }

      setIsConnected(false)
    }
  }, [gameId])

  const pressBuzzer = useCallback(async (teamId) => {
    if (!gameId || !teamId) {
      return { success: false, error: 'Juego o equipo no disponible' }
    }

    try {
      const response = await apiClient.post('/api/buzzer/press', { gameId, teamId })
      const result = unwrap(response)

      setBuzzerState((current) => ({
        ...current,
        pressed: true,
        teamId: result.teamId ?? teamId,
        timestamp: result.timestamp ?? new Date().toISOString(),
        acceptingBuzzers: false,
        responseStartedAt: result.timestamp ?? new Date().toISOString(),
        responseEndsAt: result.responseEndsAt ?? current.responseEndsAt,
        responseTimeLimit: result.responseTimeLimit ?? current.responseTimeLimit,
        responseRemainingSeconds: getRemainingSeconds(result.responseEndsAt),
        answeringTeamId: result.teamId ?? teamId,
      }))

      return { success: true, data: result }
    } catch (error) {
      const message = error.data?.error || error.message || 'Error al presionar el buzzer'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [gameId])

  const resetBuzzer = useCallback(async () => {
    if (!gameId) {
      return { success: false, error: 'Juego no disponible' }
    }

    try {
      const response = await apiClient.post('/api/buzzer/reset', { gameId })
      const result = unwrap(response)

      setBuzzerState((current) => ({
        ...current,
        pressed: false,
        teamId: null,
        timestamp: null,
        acceptingBuzzers: !current.locked && getRemainingSeconds(current.unlockAt) === 0,
        responseStartedAt: null,
        responseEndsAt: null,
        responseRemainingSeconds: 0,
        answeringTeamId: null,
      }))

      return { success: true, data: result }
    } catch (error) {
      const message = error.data?.error || error.message || 'Error al reiniciar el buzzer'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [gameId])

  const lockBuzzer = useCallback(async (locked = true) => {
    if (!gameId) {
      return { success: false, error: 'Juego no disponible' }
    }

    try {
      const response = await apiClient.post('/api/buzzer/lock', { gameId, locked })
      const result = unwrap(response)

      setBuzzerState((current) => ({ ...current, locked: result.locked ?? locked }))

      return { success: true, data: result }
    } catch (error) {
      const message = error.data?.error || error.message || 'Error al bloquear el buzzer'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [gameId])

  return {
    isConnected,
    buzzerState,
    gameState,
    pressBuzzer,
    resetBuzzer,
    lockBuzzer,
    getGameStatus: syncLobby,
    socket: null,
  }
}

export default useReverb
