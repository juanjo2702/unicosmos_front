import { useEffect, useRef, useState, useCallback } from 'react'
import echo from '../echo'
import toast from 'react-hot-toast'
import apiClient from '../api/client'

const useReverb = (gameId = 'default') => {
  const [isConnected, setIsConnected] = useState(false)
  const [buzzerState, setBuzzerState] = useState({
    pressed: false,
    teamId: null,
    timestamp: null
  })
  const [gameState, setGameState] = useState(null)

  // Listen to events
  useEffect(() => {
    const channel = echo.channel(`game.${gameId}`)

    channel.listen('.buzzer.pressed', (data) => {
      console.log('Buzzer pressed event:', data)
      setBuzzerState({
        pressed: true,
        teamId: data.teamId,
        timestamp: data.timestamp
      })
      toast.success(`¡Equipo ${data.teamId} presionó el buzzer!`)
    })

    channel.listen('.buzzer.reset', () => {
      console.log('Buzzer reset event')
      setBuzzerState({
        pressed: false,
        teamId: null,
        timestamp: null
      })
      toast('Buzzer reiniciado', { icon: '🔄' })
    })

    channel.listen('.buzzer.locked', ({ locked }) => {
      console.log('Buzzer locked event:', locked)
      toast(locked ? 'Buzzer bloqueado' : 'Buzzer desbloqueado', {
        icon: locked ? '🔒' : '🔓'
      })
    })

    channel.listen('.game.started', (data) => {
      console.log('Game started event:', data)
      setGameState(data.game)
      toast.success(`¡Juego ${data.gameId} iniciado!`)
    })

    // Connect to channel
    channel.subscribed(() => {
      setIsConnected(true)
      console.log('Connected to Reverb channel:', channel.name)
    })

    channel.error((error) => {
      console.error('Reverb channel error:', error)
      toast.error('Error de conexión')
    })

    return () => {
      channel.unsubscribe()
      setIsConnected(false)
    }
  }, [gameId])

  const pressBuzzer = useCallback(async (teamId) => {
    if (!isConnected) {
      toast.error('No conectado al servidor')
      return { success: false, error: 'Not connected' }
    }

    try {
      const data = await apiClient.post('/api/buzzer/press', { gameId, teamId })
      return { success: true, data }
    } catch (error) {
      console.error('Error pressing buzzer:', error)
      toast.error(error.data?.error || 'Error al presionar el buzzer')
      return { success: false, error: error.message }
    }
  }, [gameId, isConnected])

  const resetBuzzer = useCallback(async () => {
    try {
      const data = await apiClient.post('/api/buzzer/reset', { gameId })
      return { success: true, data }
    } catch (error) {
      console.error('Error resetting buzzer:', error)
      toast.error(error.data?.error || 'Error al reiniciar el buzzer')
      return { success: false, error: error.message }
    }
  }, [gameId])

  const lockBuzzer = useCallback(async (locked = true) => {
    try {
      const data = await apiClient.post('/api/buzzer/lock', { gameId, locked })
      return { success: true, data }
    } catch (error) {
      console.error('Error locking buzzer:', error)
      toast.error(error.data?.error || 'Error al actualizar el bloqueo del buzzer')
      return { success: false, error: error.message }
    }
  }, [gameId])

  const getGameStatus = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/games/${gameId}/lobby`)
      return data
    } catch (error) {
      console.error('Error getting game status:', error)
      return null
    }
  }, [gameId])

  return {
    isConnected,
    buzzerState,
    gameState,
    pressBuzzer,
    resetBuzzer,
    lockBuzzer,
    getGameStatus,
    socket: null // Keep compatibility
  }
}

export default useReverb